const router      = require('express').Router();
const pool        = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// Verify the authenticated user owns the given event, returns event row or 404
async function requireEventOwner(req, res, next) {
  const { eventId } = req.params;
  const { rows } = await pool.query(
    `SELECT e.id FROM events e
     JOIN hosts h ON h.id = e.host_id
     WHERE e.id = $1 AND h.auth_id = $2`,
    [eventId, req.user.authId],
  );
  if (!rows.length) {
    const err = new Error('Event not found or access denied');
    err.status = 404;
    return next(err);
  }
  next();
}

// GET /api/events/:eventId/cohosts
router.get('/:eventId/cohosts', requireAuth, requireEventOwner, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, invited_at, accepted_at
       FROM event_cohosts
       WHERE event_id = $1
       ORDER BY invited_at ASC`,
      [req.params.eventId],
    );
    res.json({ cohosts: rows });
  } catch (err) { next(err); }
});

// POST /api/events/:eventId/cohosts  { email }
router.post('/:eventId/cohosts', requireAuth, requireEventOwner, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      const err = new Error('Valid email is required');
      err.status = 400;
      return next(err);
    }
    const { rows } = await pool.query(
      `INSERT INTO event_cohosts (event_id, email)
       VALUES ($1, $2)
       ON CONFLICT (event_id, email) DO NOTHING
       RETURNING id, email, invited_at`,
      [req.params.eventId, email.trim().toLowerCase()],
    );
    // If nothing inserted it was a duplicate — still return 200 (idempotent)
    res.json({ cohost: rows[0] ?? null });
  } catch (err) { next(err); }
});

// DELETE /api/events/:eventId/cohosts/:cohostId
router.delete('/:eventId/cohosts/:cohostId', requireAuth, requireEventOwner, async (req, res, next) => {
  try {
    await pool.query(
      `DELETE FROM event_cohosts WHERE id = $1 AND event_id = $2`,
      [req.params.cohostId, req.params.eventId],
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
