const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('../config/db');
const { singleImageUpload } = require('../middleware/uploadMiddleware');

// Google Drive
const { getValidAccessToken }  = require('../services/googleTokenService');
const { buildDriveClient, getOrCreateEventFolder: getDriveFolder, uploadFile: uploadToDrive, makeFilePublic, thumbnailUrl: driveThumb } = require('../services/driveService');

// Dropbox
const { getValidDropboxToken } = require('../services/dropboxTokenService');
const { getOrCreateEventFolder: getDropboxFolder, uploadFile: uploadToDropbox, getPublicThumbnailUrl: dropboxThumb } = require('../services/dropboxService');

// OneDrive
const { getValidOneDriveToken } = require('../services/oneDriveTokenService');
const { getOrCreateEventFolder: getOneDriveFolder, uploadFile: uploadToOneDrive, getPublicThumbnailUrl: oneDriveThumb } = require('../services/oneDriveService');

const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads from this device. Please wait a few minutes.' },
});

function sanitizeGuestName(raw) {
  return (raw ?? 'Guest')
    .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50) || 'Guest';
}

function safeTimestamp() {
  return new Date().toISOString().replace(/:/g, '-');
}

function extForMime(mimeType) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png':  '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
  };
  return map[mimeType] ?? path.extname('');
}

// ── Provider dispatch ─────────────────────────────────────────────────────────

async function uploadViaGoogleDrive(row, buffer, filename, mimeType) {
  const accessToken = await getValidAccessToken(row);
  const driveClient = buildDriveClient(accessToken);

  const event = { id: row.event_id, name: row.event_name, drive_folder_id: row.drive_folder_id };
  const folderId = await getDriveFolder(driveClient, event);

  const uploaded = await uploadToDrive(driveClient, buffer, filename, mimeType, folderId);

  try {
    await makeFilePublic(driveClient, uploaded.id);
  } catch (e) {
    console.warn('makeFilePublic failed (non-fatal):', e.message);
  }

  return { fileId: uploaded.id, thumbnailUrl: driveThumb(uploaded.id) };
}

async function uploadViaDropbox(row, buffer, filename) {
  const token = await getValidDropboxToken(row);

  const event = { id: row.event_id, name: row.event_name, drive_folder_id: row.drive_folder_id };
  const folderPath = await getDropboxFolder(token, event);

  const uploaded = await uploadToDropbox(token, buffer, filename, null, folderPath);
  const thumbUrl  = await dropboxThumb(token, uploaded.path_display);

  return { fileId: uploaded.id, thumbnailUrl: thumbUrl };
}

async function uploadViaOneDrive(row, buffer, filename, mimeType) {
  const token = await getValidOneDriveToken(row);

  const event    = { id: row.event_id, name: row.event_name, drive_folder_id: row.drive_folder_id };
  const folderId = await getOneDriveFolder(token, event);

  const uploaded = await uploadToOneDrive(token, buffer, filename, mimeType, folderId);
  const thumbUrl = await oneDriveThumb(token, uploaded.id);

  return { fileId: uploaded.id, thumbnailUrl: thumbUrl };
}

// ─── POST /api/events/:eventCode/upload ───────────────────────────────────────
router.post(
  '/events/:eventCode/upload',
  uploadRateLimit,
  singleImageUpload,
  async (req, res, next) => {
    try {
      if (!req.file) {
        const err = new Error('No photo file received. Send the image in a field named "photo".');
        err.status = 400;
        return next(err);
      }

      const { eventCode } = req.params;
      const guestName = sanitizeGuestName(req.body.guestName);

      // Fetch event + whichever cloud token is linked (most recently updated wins)
      const { rows } = await pool.query(
        `SELECT
           e.id              AS event_id,
           e.name            AS event_name,
           e.status          AS event_status,
           e.drive_folder_id,
           ct.id             AS id,
           ct.provider,
           ct.access_token_enc,
           ct.refresh_token_enc,
           ct.token_expires_at
         FROM events e
         JOIN cloud_tokens ct ON ct.event_id = e.id
         WHERE e.join_code = $1
         ORDER BY ct.updated_at DESC
         LIMIT 1`,
        [eventCode.toUpperCase()],
      );

      if (!rows.length) {
        const err = new Error('Event not found or no cloud storage is linked to this event.');
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

      const ext      = extForMime(req.file.mimetype);
      const filename = `${guestName}_${safeTimestamp()}${ext}`;

      let fileId, thumbUrl;

      if (row.provider === 'google_drive') {
        ({ fileId, thumbnailUrl: thumbUrl } = await uploadViaGoogleDrive(
          row, req.file.buffer, filename, req.file.mimetype,
        ));
      } else if (row.provider === 'dropbox') {
        ({ fileId, thumbnailUrl: thumbUrl } = await uploadViaDropbox(
          row, req.file.buffer, filename,
        ));
      } else if (row.provider === 'onedrive') {
        ({ fileId, thumbnailUrl: thumbUrl } = await uploadViaOneDrive(
          row, req.file.buffer, filename, req.file.mimetype,
        ));
      } else {
        throw new Error(`Unsupported storage provider: ${row.provider}`);
      }

      await pool.query(
        `INSERT INTO photos (event_id, guest_name, drive_file_id, thumbnail_url)
         VALUES ($1, $2, $3, $4)`,
        [row.event_id, guestName, fileId, thumbUrl],
      );

      res.status(201).json({
        success: true,
        file: { name: filename, fileId, thumbnailUrl: thumbUrl },
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
