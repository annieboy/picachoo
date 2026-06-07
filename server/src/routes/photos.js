const router      = require('express').Router();
const pool        = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// ─── GET /api/events/:eventCode/photos ────────────────────────────────────────
// Returns the most recent photos for an event — used by the wall on first load.
// Public endpoint (no auth) — the wall is meant to be projected openly.
router.get('/events/:eventCode/photos', async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  ?? '60',  10), 200);
    const offset = Math.max(parseInt(req.query.offset ?? '0',   10), 0);

    const { rows } = await pool.query(
      `SELECT p.id, p.guest_name, p.thumbnail_url, p.created_at, p.aspect_ratio
         FROM photos p
         JOIN events e ON e.id = p.event_id
        WHERE e.join_code = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3`,
      [req.params.eventCode.toUpperCase(), limit, offset],
    );

    res.json({ photos: rows, hasMore: rows.length === limit });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/photos/:photoId ─────────────────────────────────────────────
// Authenticated host only. Verifies the photo belongs to an event owned by the
// requesting host before deleting the metadata row.
router.delete('/photos/:photoId', requireAuth, async (req, res, next) => {
  try {
    const { rows: hostRows } = await pool.query(
      `SELECT id FROM hosts WHERE auth_id = $1`,
      [req.user.authId],
    );
    if (!hostRows.length) {
      const err = new Error('Host not found'); err.status = 404; return next(err);
    }
    const hostId = hostRows[0].id;

    // Delete only if the photo's event is owned by this host
    const { rowCount } = await pool.query(
      `DELETE FROM photos p
         USING events e
         WHERE p.id = $1
           AND p.event_id = e.id
           AND e.host_id  = $2`,
      [req.params.photoId, hostId],
    );

    if (rowCount === 0) {
      const err = new Error('Photo not found or not authorised'); err.status = 404; return next(err);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
