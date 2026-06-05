const router = require('express').Router();
const pool = require('../config/db');

// ─── GET /api/events/:eventCode/photos ────────────────────────────────────────
// Returns the most recent photos for an event — used by the wall on first load.
// Public endpoint (no auth) — the wall is meant to be projected openly.
router.get('/events/:eventCode/photos', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 50);

    const { rows } = await pool.query(
      `SELECT p.id, p.guest_name, p.thumbnail_url, p.created_at
         FROM photos p
         JOIN events e ON e.id = p.event_id
        WHERE e.join_code = $1
        ORDER BY p.created_at DESC
        LIMIT $2`,
      [req.params.eventCode.toUpperCase(), limit],
    );

    res.json({ photos: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
