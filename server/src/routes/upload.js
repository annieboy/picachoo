const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('../config/db');
const { singleImageUpload } = require('../middleware/uploadMiddleware');
const { getValidAccessToken } = require('../services/googleTokenService');
const { buildDriveClient, getOrCreateEventFolder, uploadFile } = require('../services/driveService');

// Stricter rate limit for the upload endpoint specifically.
// 30 uploads per IP per 15 minutes is plenty for a single guest at an event.
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads from this device. Please wait a few minutes.' },
});

/**
 * Sanitizes a guest display name for use in a filename:
 * strips path separators and control characters, collapses whitespace,
 * truncates to 50 chars so filenames stay reasonable.
 */
function sanitizeGuestName(raw) {
  return (raw ?? 'Guest')
    .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50) || 'Guest';
}

/**
 * Returns a filesystem-safe ISO timestamp, e.g. "2024-06-01T12-00-00.000Z"
 * (colons replaced with dashes so the name is valid on all OSes).
 */
function safeTimestamp() {
  return new Date().toISOString().replace(/:/g, '-');
}

/**
 * Maps a MIME type to a canonical extension for the saved filename.
 */
function extForMime(mimeType) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png':  '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
  };
  return map[mimeType] ?? path.extname(/* fallback */ '');
}

// ─── POST /api/events/:eventCode/upload ───────────────────────────────────────
//
// Multipart form-data fields:
//   photo       (file, required)  — the image to upload
//   guestName   (text, optional)  — display name shown in the filename
//
router.post(
  '/events/:eventCode/upload',
  uploadRateLimit,
  singleImageUpload,
  async (req, res, next) => {
    try {
      // ── 1. Validate the uploaded file ──────────────────────────────────────
      if (!req.file) {
        const err = new Error('No photo file received. Send the image in a field named "photo".');
        err.status = 400;
        return next(err);
      }

      const { eventCode } = req.params;
      const guestName = sanitizeGuestName(req.body.guestName);

      // ── 2. Look up event + token in a single JOIN ──────────────────────────
      // We fetch the cloud_tokens row alongside the event so we have everything
      // needed without a second round-trip.
      const { rows } = await pool.query(
        `SELECT
           e.id              AS event_id,
           e.name            AS event_name,
           e.status          AS event_status,
           e.drive_folder_id,
           ct.id             AS id,
           ct.access_token_enc,
           ct.refresh_token_enc,
           ct.token_expires_at
         FROM events e
         JOIN cloud_tokens ct
           ON ct.event_id = e.id AND ct.provider = 'google_drive'
         WHERE e.join_code = $1`,
        [eventCode.toUpperCase()],
      );

      if (!rows.length) {
        const err = new Error('Event not found or Google Drive is not linked to this event.');
        err.status = 404;
        return next(err);
      }

      const row = rows[0];

      if (row.event_status === 'closed') {
        const err = new Error('This event has ended and is no longer accepting uploads.');
        err.status = 403;
        return next(err);
      }

      if (row.event_status === 'draft') {
        const err = new Error('This event has not started yet.');
        err.status = 403;
        return next(err);
      }

      // ── 3. Decrypt / refresh the token and build the Drive client ──────────
      // Pass the token row directly — the JOIN already fetched everything
      // getValidAccessToken needs, so no second DB query is required.
      const accessToken = await getValidAccessToken(row);
      const driveClient = buildDriveClient(accessToken);

      // ── 4. Get or create the event folder (cached after first upload) ──────
      const event = {
        id: row.event_id,
        name: row.event_name,
        drive_folder_id: row.drive_folder_id,
      };
      const folderId = await getOrCreateEventFolder(driveClient, event);

      // ── 5. Build the filename and upload ───────────────────────────────────
      const ext = extForMime(req.file.mimetype);
      const filename = `${guestName}_${safeTimestamp()}${ext}`;

      const uploaded = await uploadFile(
        driveClient,
        req.file.buffer,
        filename,
        req.file.mimetype,
        folderId,
      );

      res.status(201).json({
        success: true,
        file: {
          name: uploaded.name,
          driveFileId: uploaded.id,
          viewLink: uploaded.webViewLink,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
