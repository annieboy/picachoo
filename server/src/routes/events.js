const router      = require('express').Router();
const pool        = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── POST /api/events  (also /api/events/create) ─────────────────────────────
// Host must be authenticated. hostId is resolved from the JWT — never trusted
// from the request body.
async function createEvent(req, res, next) {
  try {
    const { name, description, startsAt, endsAt } = req.body;

    if (!name) {
      const err = new Error('name is required');
      err.status = 400;
      return next(err);
    }

    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      const err = new Error('startsAt must be before endsAt');
      err.status = 400;
      return next(err);
    }

    // Resolve the host row from the authenticated user
    const { rows: hostRows } = await pool.query(
      `SELECT id, tier FROM hosts WHERE auth_id = $1`,
      [req.user.authId],
    );
    if (!hostRows.length) {
      const err = new Error('Host profile not found — please sign in again');
      err.status = 404;
      return next(err);
    }
    const { id: hostId, tier } = hostRows[0];
    const isPaid = ['pro', 'pro_annual', 'business_annual'].includes(tier);

    // Free tier: max 1 event created in the current calendar month
    if (!isPaid) {
      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*) AS n FROM events
         WHERE host_id = $1
           AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
        [hostId],
      );
      if (parseInt(countRows[0].n, 10) >= 1) {
        const err = new Error('Free plan allows 1 event per month. Upgrade to Pro for unlimited events.');
        err.status = 403;
        return next(err);
      }
    }

    // Generate a unique join code
    let joinCode;
    for (let i = 0; i < 5; i++) {
      const candidate = generateJoinCode();
      const { rows } = await pool.query('SELECT id FROM events WHERE join_code = $1', [candidate]);
      if (!rows.length) { joinCode = candidate; break; }
    }
    if (!joinCode) throw new Error('Could not generate a unique join code, please try again');

    const { rows } = await pool.query(
      `INSERT INTO events (host_id, name, description, join_code, status, starts_at, ends_at,
                           wall_view_token)
       VALUES ($1, $2, $3, $4, 'active', $5, $6,
               encode(gen_random_bytes(6), 'hex'))
       RETURNING id, name, description, join_code, status, starts_at, ends_at, wall_mode, wall_upload_mode, wall_view_token, created_at`,
      [hostId, name.trim(), description?.trim() ?? null, joinCode, startsAt ?? null, endsAt ?? null],
    );

    const event = rows[0];
    const guestUrl = `${process.env.CLIENT_ORIGIN}/e/${event.join_code}`;

    res.status(201).json({ event: { ...event, guestUrl } });
  } catch (err) {
    next(err);
  }
}

router.post('/',       requireAuth, createEvent);
router.post('/create', requireAuth, createEvent);

// ─── GET /api/events/by-code/:joinCode ───────────────────────────────────────
// Public guest-facing lookup — no auth needed.
router.get('/by-code/:joinCode', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.name, e.description, e.join_code, e.status, e.wall_mode, e.wall_upload_mode,
              e.wall_background_url, e.wall_frame_url, e.wall_view_token, e.presentation_interval_secs,
              h.tier AS host_tier,
              CASE WHEN e.is_premium_pass AND e.pass_expires_at > NOW()
                   THEN 'pro' ELSE h.tier END AS effective_tier
       FROM events e
       JOIN hosts h ON h.id = e.host_id
       WHERE e.join_code = $1`,
      [req.params.joinCode.toUpperCase()],
    );
    if (!rows.length) {
      const err = new Error('Event not found');
      err.status = 404;
      return next(err);
    }
    const event = rows[0];

    // Check if the requester supplied a valid wall view token
    const suppliedToken = req.query.wallToken;
    const wallAccessGranted = !!(suppliedToken && suppliedToken === event.wall_view_token);

    // Never expose the secret token in the public response
    const { wall_view_token, ...safeEvent } = event;

    res.json({ event: { ...safeEvent, wall_access_granted: wallAccessGranted } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/events/:eventId ─────────────────────────────────────────────────
// Requires authentication — only the event owner (or co-host) can fetch details.
router.get('/:eventId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         e.id, e.name, e.description, e.join_code, e.status,
         e.starts_at, e.ends_at, e.created_at,
         ct.provider               AS linked_provider,
         ct.provider_account_email AS linked_account
       FROM events e
       LEFT JOIN cloud_tokens ct ON ct.event_id = e.id
       WHERE e.id = $1
         AND e.host_id = (SELECT id FROM hosts WHERE auth_id = $2)`,
      [req.params.eventId, req.user.authId],
    );
    if (!rows.length) {
      const err = new Error('Event not found');
      err.status = 404;
      return next(err);
    }
    const guestUrl = `${process.env.CLIENT_ORIGIN}/e/${rows[0].join_code}`;
    res.json({ event: { ...rows[0], guestUrl } });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/events/:eventId ───────────────────────────────────────────────
router.patch('/:eventId', requireAuth, async (req, res, next) => {
  try {
    const { status, name, description, startsAt, endsAt, wallMode, wallUploadMode, presentationIntervalSecs } = req.body;

    if (status && !['draft', 'active', 'closed'].includes(status)) {
      const err = new Error('status must be draft, active, or closed');
      err.status = 400;
      return next(err);
    }
    if (wallMode && !['off', 'everyone', 'host_only'].includes(wallMode)) {
      const err = new Error('wallMode must be off, everyone, or host_only');
      err.status = 400;
      return next(err);
    }
    if (wallUploadMode && !['everyone', 'host_only'].includes(wallUploadMode)) {
      const err = new Error('wallUploadMode must be everyone or host_only');
      err.status = 400;
      return next(err);
    }

    // Live Wall is a Pro feature — free hosts can only set it to 'off'
    let isPaidHost = false;
    if (wallMode && wallMode !== 'off' || presentationIntervalSecs !== undefined) {
      const { rows: tierRows } = await pool.query(
        `SELECT tier FROM hosts WHERE auth_id = $1`,
        [req.user.authId],
      );
      const tier = tierRows[0]?.tier ?? 'free';
      isPaidHost = ['pro', 'pro_annual', 'business_annual'].includes(tier);
      if (wallMode && wallMode !== 'off' && !isPaidHost) {
        const err = new Error('Live Wall is available on Pro and Business plans. Upgrade to enable it.');
        err.status = 403;
        return next(err);
      }
    }

    // Validate & clamp interval; free tier is locked to 6s
    let intervalSecs = null;
    if (presentationIntervalSecs !== undefined) {
      if (!isPaidHost) {
        const err = new Error('Custom slideshow speed is a Pro feature.');
        err.status = 403;
        return next(err);
      }
      intervalSecs = Math.min(Math.max(Math.round(Number(presentationIntervalSecs)), 3), 30);
      if (!Number.isFinite(intervalSecs)) {
        const err = new Error('presentationIntervalSecs must be a number between 3 and 30');
        err.status = 400;
        return next(err);
      }
    }

    // Verify ownership via auth_id
    const { rows } = await pool.query(
      `UPDATE events SET
         name                       = COALESCE($1, name),
         description                = COALESCE($2, description),
         status                     = COALESCE($3, status),
         starts_at                  = COALESCE($4, starts_at),
         ends_at                    = COALESCE($5, ends_at),
         wall_mode                  = COALESCE($8, wall_mode),
         wall_upload_mode           = COALESCE($9, wall_upload_mode),
         presentation_interval_secs = COALESCE($10, presentation_interval_secs)
       WHERE id = $6
         AND host_id = (SELECT id FROM hosts WHERE auth_id = $7)
       RETURNING id, name, description, join_code, status, starts_at, ends_at,
                 wall_mode, wall_upload_mode, presentation_interval_secs`,
      [name ?? null, description ?? null, status ?? null, startsAt ?? null, endsAt ?? null,
       req.params.eventId, req.user.authId, wallMode ?? null, wallUploadMode ?? null,
       intervalSecs],
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

// ─── DELETE /api/events/:eventId ─────────────────────────────────────────────
router.delete('/:eventId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM events
       WHERE id = $1
         AND host_id = (SELECT id FROM hosts WHERE auth_id = $2)
       RETURNING id`,
      [req.params.eventId, req.user.authId],
    );
    if (!rows.length) {
      const err = new Error('Event not found or does not belong to this host');
      err.status = 404;
      return next(err);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
