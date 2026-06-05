const router     = require('express').Router();
const pool       = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// ─── GET /api/hosts/me ────────────────────────────────────────────────────────
// Called immediately after sign-in. Upserts the host row from the JWT claims,
// then returns the host + their events in a single response.
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { authId, email, name } = req.user;

    const { rows } = await pool.query(
      `INSERT INTO hosts (auth_id, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (auth_id)
       DO UPDATE SET
         email        = EXCLUDED.email,
         display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), hosts.display_name),
         updated_at   = NOW()
       RETURNING id, email, display_name, tier, created_at`,
      [authId, email.toLowerCase(), name || email.split('@')[0]],
    );

    const host = rows[0];

    const eventsResult = await pool.query(
      `SELECT
         e.id, e.name, e.join_code, e.status, e.created_at,
         ct.provider               AS linked_provider,
         ct.provider_account_email AS linked_account,
         COUNT(p.id)               AS photo_count,
         MAX(p.created_at)         AS last_photo_at
       FROM events e
       LEFT JOIN cloud_tokens ct ON ct.event_id = e.id
       LEFT JOIN photos p        ON p.event_id  = e.id
       WHERE e.host_id = $1
       GROUP BY e.id, ct.provider, ct.provider_account_email
       ORDER BY e.created_at DESC`,
      [host.id],
    );

    res.json({ host, events: eventsResult.rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/hosts/:hostId ───────────────────────────────────────────────────
// Kept for any internal calls that look up a host by DB UUID.
router.get('/:hostId', requireAuth, async (req, res, next) => {
  try {
    const { rows: hostRows } = await pool.query(
      `SELECT id, email, display_name, created_at
         FROM hosts WHERE id = $1 AND auth_id = $2`,
      [req.params.hostId, req.user.authId],
    );

    if (!hostRows.length) {
      const err = new Error('Host not found');
      err.status = 404;
      return next(err);
    }

    const { rows: eventRows } = await pool.query(
      `SELECT
         e.id, e.name, e.join_code, e.status, e.created_at,
         ct.provider               AS linked_provider,
         ct.provider_account_email AS linked_account,
         COUNT(p.id)               AS photo_count,
         MAX(p.created_at)         AS last_photo_at
       FROM events e
       LEFT JOIN cloud_tokens ct ON ct.event_id = e.id
       LEFT JOIN photos p        ON p.event_id  = e.id
       WHERE e.host_id = $1
       GROUP BY e.id, ct.provider, ct.provider_account_email
       ORDER BY e.created_at DESC`,
      [hostRows[0].id],
    );

    res.json({ host: hostRows[0], events: eventRows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
