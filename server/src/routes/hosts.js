const router = require('express').Router();
const pool = require('../config/db');

// ─── POST /api/hosts/register ─────────────────────────────────────────────────
// Creates a new host account or returns the existing one for that email.
// Body: { email, displayName }
router.post('/register', async (req, res, next) => {
  try {
    const { email, displayName } = req.body;

    if (!email || !displayName) {
      const err = new Error('email and displayName are required');
      err.status = 400;
      return next(err);
    }

    const emailClean = email.trim().toLowerCase();
    const nameClean  = displayName.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      const err = new Error('Invalid email address');
      err.status = 400;
      return next(err);
    }

    // Upsert: if host already exists return their record without error.
    const { rows } = await pool.query(
      `INSERT INTO hosts (email, display_name)
       VALUES ($1, $2)
       ON CONFLICT (email)
       DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = NOW()
       RETURNING id, email, display_name, created_at`,
      [emailClean, nameClean],
    );

    res.status(201).json({ host: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/hosts/:hostId ───────────────────────────────────────────────────
// Returns a host and their events.
router.get('/:hostId', async (req, res, next) => {
  try {
    const { hostId } = req.params;

    const hostResult = await pool.query(
      `SELECT id, email, display_name, created_at FROM hosts WHERE id = $1`,
      [hostId],
    );

    if (!hostResult.rows.length) {
      const err = new Error('Host not found');
      err.status = 404;
      return next(err);
    }

    const eventsResult = await pool.query(
      `SELECT
         e.id, e.name, e.description, e.join_code, e.status,
         e.starts_at, e.ends_at, e.created_at,
         ct.provider AS linked_provider,
         ct.provider_account_email AS linked_account
       FROM events e
       LEFT JOIN cloud_tokens ct ON ct.event_id = e.id
       WHERE e.host_id = $1
       ORDER BY e.created_at DESC`,
      [hostId],
    );

    res.json({ host: hostResult.rows[0], events: eventsResult.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
