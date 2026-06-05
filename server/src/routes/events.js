const router = require('express').Router();
const pool = require('../config/db');

// Generates a random uppercase alphanumeric join code, e.g. "WEDD24"
function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── POST /api/events  (also aliased as /api/events/create) ──────────────────
// Creates a new event for a host.
// Body: { hostId, name, description?, startsAt?, endsAt? }
async function createEvent(req, res, next) {
  try {
    const { hostId, name, description, startsAt, endsAt } = req.body;

    if (!hostId || !name) {
      const err = new Error('hostId and name are required');
      err.status = 400;
      return next(err);
    }

    // Verify the host exists
    const hostCheck = await pool.query(
      'SELECT id FROM hosts WHERE id = $1',
      [hostId],
    );
    if (!hostCheck.rows.length) {
      const err = new Error('Host not found');
      err.status = 404;
      return next(err);
    }

    // Generate a unique join code — retry up to 5 times on the rare collision
    let joinCode;
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateJoinCode();
      const exists = await pool.query(
        'SELECT id FROM events WHERE join_code = $1',
        [candidate],
      );
      if (!exists.rows.length) {
        joinCode = candidate;
        break;
      }
      attempts++;
    }
    if (!joinCode) {
      throw new Error('Could not generate a unique join code, please try again');
    }

    const { rows } = await pool.query(
      `INSERT INTO events (host_id, name, description, join_code, status, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, 'active', $5, $6)
       RETURNING id, name, description, join_code, status, starts_at, ends_at, created_at`,
      [hostId, name.trim(), description?.trim() ?? null, joinCode, startsAt ?? null, endsAt ?? null],
    );

    const event = rows[0];

    // The guest upload URL — frontend opens this when scanning the QR code
    const guestUrl = `${process.env.CLIENT_ORIGIN}/events/${event.join_code}`;

    res.status(201).json({ event: { ...event, guestUrl } });
  } catch (err) {
    next(err);
  }
}

router.post('/',        createEvent);
router.post('/create',  createEvent); // alias

// ─── GET /api/events/:eventId ─────────────────────────────────────────────────
// Returns full event details including linked Drive status.
router.get('/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const { rows } = await pool.query(
      `SELECT
         e.id, e.name, e.description, e.join_code, e.status,
         e.starts_at, e.ends_at, e.created_at,
         ct.provider            AS linked_provider,
         ct.provider_account_email AS linked_account,
         ct.destination_folder_name
       FROM events e
       LEFT JOIN cloud_tokens ct ON ct.event_id = e.id
       WHERE e.id = $1`,
      [eventId],
    );

    if (!rows.length) {
      const err = new Error('Event not found');
      err.status = 404;
      return next(err);
    }

    const event = rows[0];
    const guestUrl = `${process.env.CLIENT_ORIGIN}/events/${event.join_code}`;

    res.json({ event: { ...event, guestUrl } });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/events/:eventId ───────────────────────────────────────────────
// Update event status or details.
// Body: { hostId, status?, name?, description?, startsAt?, endsAt? }
router.patch('/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { hostId, status, name, description, startsAt, endsAt } = req.body;

    if (!hostId) {
      const err = new Error('hostId is required');
      err.status = 400;
      return next(err);
    }

    if (status && !['draft', 'active', 'closed'].includes(status)) {
      const err = new Error('status must be draft, active, or closed');
      err.status = 400;
      return next(err);
    }

    const { rows } = await pool.query(
      `UPDATE events SET
         name        = COALESCE($1, name),
         description = COALESCE($2, description),
         status      = COALESCE($3, status),
         starts_at   = COALESCE($4, starts_at),
         ends_at     = COALESCE($5, ends_at)
       WHERE id = $6 AND host_id = $7
       RETURNING id, name, description, join_code, status, starts_at, ends_at`,
      [name ?? null, description ?? null, status ?? null, startsAt ?? null, endsAt ?? null, eventId, hostId],
    );

    if (!rows.length) {
      const err = new Error('Event not found or does not belong to this host');
      err.status = 404;
      return next(err);
    }

    res.json({ event: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
