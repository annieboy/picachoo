const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('../config/db');
const { singleImageUpload } = require('../middleware/uploadMiddleware');

// Google Drive
const { getValidAccessToken }  = require('../services/googleTokenService');
const { buildDriveClient, getOrCreateEventFolder: getDriveFolder, uploadFile: uploadToDrive, makeFilePublic, thumbnailUrl: driveThumb, createResumableUploadSession } = require('../services/driveService');

// Dropbox
const { getValidDropboxToken } = require('../services/dropboxTokenService');
const { getOrCreateEventFolder: getDropboxFolder, uploadFile: uploadToDropbox, getPublicThumbnailUrl: dropboxThumb } = require('../services/dropboxService');

// OneDrive
const { getValidOneDriveToken } = require('../services/oneDriveTokenService');
const { getOrCreateEventFolder: getOneDriveFolder, uploadFile: uploadToOneDrive, getPublicThumbnailUrl: oneDriveThumb, createUploadSession: createOneDriveUploadSession } = require('../services/oneDriveService');

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

// ── Quota error detection ─────────────────────────────────────────────────────

function isQuotaError(err) {
  const msg = (err?.message ?? '').toLowerCase();
  return (
    msg.includes('storagequota') ||       // Google Drive
    msg.includes('not_enough_space') ||   // Dropbox
    msg.includes('quota') ||              // OneDrive / generic
    msg.includes('insufficient') ||
    err?.code === 507                     // HTTP 507 Insufficient Storage
  );
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

      // Fetch event + host tier + whichever cloud token is linked (most recently updated wins)
      const { rows } = await pool.query(
        `SELECT
           e.id              AS event_id,
           e.name            AS event_name,
           e.status          AS event_status,
           e.wall_upload_mode,
           e.drive_folder_id,
           e.is_premium_pass,
           e.pass_expires_at,
           h.tier            AS host_tier,
           ct.id             AS id,
           ct.provider,
           ct.access_token_enc,
           ct.refresh_token_enc,
           ct.token_expires_at
         FROM events e
         JOIN hosts h         ON h.id = e.host_id
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

      if (row.wall_upload_mode === 'host_only') {
        const err = new Error('Photo uploads are currently disabled for this event.');
        err.status = 403;
        return next(err);
      }

      // Free tier: enforce 2 MB per upload
      const passActive = row.is_premium_pass && row.pass_expires_at && new Date(row.pass_expires_at) > new Date();
      const isPro = passActive || ['pro', 'pro_annual', 'business_annual'].includes(row.host_tier);
      const FREE_MAX = 2 * 1024 * 1024;
      if (!isPro && req.file.size > FREE_MAX) {
        const err = new Error('File exceeds the 2 MB limit on the Free plan. Ask the event host to upgrade to Pro for full-resolution uploads.');
        err.status = 413;
        return next(err);
      }

      const ext      = extForMime(req.file.mimetype);
      const filename = `${guestName}_${safeTimestamp()}${ext}`;

      let fileId, thumbUrl;

      try {
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
      } catch (uploadErr) {
        // Log the raw provider error so it appears in Vercel function logs
        console.error('[upload] provider error:', uploadErr.message, uploadErr.stack);

        if (isQuotaError(uploadErr)) {
          const err = new Error(
            'The cloud storage is full. Photos cannot be saved until the owner frees up space.'
          );
          err.status = 507;
          return next(err);
        }

        // Map provider auth errors (Drive/Dropbox/OneDrive return 401/403) to a
        // clear 403 so guests see an actionable message instead of a generic 500.
        const providerStatus = uploadErr.status ?? uploadErr.response?.status ?? uploadErr.code;
        if (providerStatus === 401 || providerStatus === 403 ||
            providerStatus === '401' || providerStatus === '403') {
          const err = new Error(
            'The event storage is not properly connected. Please ask the host to reconnect their cloud storage.'
          );
          err.status = 403;
          return next(err);
        }

        throw uploadErr;
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

// ─── POST /api/events/:eventCode/upload-session ───────────────────────────────
// All tiers. Creates a direct-to-cloud upload session so the guest's browser
// uploads straight to Drive/OneDrive — Vercel never touches the bytes.
// Returns { direct:true, uploadUrl, filename, provider, eventId, hostTier }
// or      { direct:false, hostTier } when provider is Dropbox (no presigned URL).
router.post(
  '/events/:eventCode/upload-session',
  uploadRateLimit,
  async (req, res, next) => {
    try {
      const { eventCode } = req.params;
      const { guestName: rawName, mimeType = 'image/jpeg' } = req.body ?? {};
      const guestName = sanitizeGuestName(rawName);

      const { rows } = await pool.query(
        `SELECT
           e.id              AS event_id,
           e.name            AS event_name,
           e.status          AS event_status,
           e.wall_upload_mode,
           e.drive_folder_id,
           e.is_premium_pass,
           e.pass_expires_at,
           h.tier            AS host_tier,
           ct.id, ct.provider,
           ct.access_token_enc, ct.refresh_token_enc, ct.token_expires_at
         FROM events e
         JOIN cloud_tokens ct ON ct.event_id = e.id
         JOIN hosts h         ON h.id = e.host_id
         WHERE e.join_code = $1
         ORDER BY ct.updated_at DESC
         LIMIT 1`,
        [eventCode.toUpperCase()],
      );

      // No storage linked or event not found → fall back to server-side upload
      if (!rows.length) return res.json({ direct: false });

      const row = rows[0];

      if (row.event_status === 'closed') {
        const err = new Error('This event has ended and is no longer accepting uploads.');
        err.status = 403;
        return next(err);
      }

      if (row.wall_upload_mode === 'host_only') {
        const err = new Error('Photo uploads are currently disabled for this event.');
        err.status = 403;
        return next(err);
      }

      // Resolve effective tier:
      // Rule 1: valid single-event pass takes priority
      // Rule 2: annual subscription tier
      const passActive = row.is_premium_pass && row.pass_expires_at && new Date(row.pass_expires_at) > new Date();
      const isPro = passActive || ['pro', 'pro_annual', 'business_annual'].includes(row.host_tier);
      const effectiveTier = isPro ? 'pro' : 'free';

      // Dropbox has no presigned-URL equivalent — fall back to server-side upload
      if (row.provider === 'dropbox') {
        return res.json({ direct: false, hostTier: effectiveTier });
      }

      const ext      = extForMime(mimeType);
      const filename = `${guestName}_${safeTimestamp()}${ext}`;

      let uploadUrl;
      try {
        if (row.provider === 'google_drive') {
          const accessToken = await getValidAccessToken(row);
          const driveClient = buildDriveClient(accessToken);
          const event       = { id: row.event_id, name: row.event_name, drive_folder_id: row.drive_folder_id };
          const folderId    = await getDriveFolder(driveClient, event);
          uploadUrl = await createResumableUploadSession(accessToken, filename, mimeType, folderId);
        } else if (row.provider === 'onedrive') {
          const token    = await getValidOneDriveToken(row);
          const event    = { id: row.event_id, name: row.event_name, drive_folder_id: row.drive_folder_id };
          const folderId = await getOneDriveFolder(token, event);
          uploadUrl = await createOneDriveUploadSession(token, filename, folderId);
        } else {
          return res.json({ direct: false });
        }
      } catch (sessionErr) {
        console.error('[upload-session] provider error:', sessionErr.message);
        return res.json({ direct: false }); // Degrade gracefully
      }

      res.json({ direct: true, uploadUrl, filename, provider: row.provider, eventId: row.event_id, hostTier: effectiveTier });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/events/:eventCode/record-upload ────────────────────────────────
// Called by the client after a successful direct-to-cloud upload.
// Finalises the file (make public, generate thumbnail URL) and records it in DB.
router.post(
  '/events/:eventCode/record-upload',
  uploadRateLimit,
  async (req, res, next) => {
    try {
      const { eventCode } = req.params;
      const { fileId, filename, guestName: rawName } = req.body ?? {};
      const guestName = sanitizeGuestName(rawName);

      if (!fileId || !guestName) {
        const err = new Error('fileId and guestName are required');
        err.status = 400;
        return next(err);
      }

      const { rows } = await pool.query(
        `SELECT
           e.id AS event_id,
           ct.id, ct.provider,
           ct.access_token_enc, ct.refresh_token_enc, ct.token_expires_at
         FROM events e
         JOIN cloud_tokens ct ON ct.event_id = e.id
         WHERE e.join_code = $1
         ORDER BY ct.updated_at DESC
         LIMIT 1`,
        [eventCode.toUpperCase()],
      );

      if (!rows.length) {
        const err = new Error('Event not found');
        err.status = 404;
        return next(err);
      }

      const row = rows[0];
      let thumbUrl = null;

      if (row.provider === 'google_drive') {
        const accessToken = await getValidAccessToken(row);
        const driveClient = buildDriveClient(accessToken);
        try { await makeFilePublic(driveClient, fileId); } catch { /* non-fatal */ }
        thumbUrl = driveThumb(fileId);
      } else if (row.provider === 'onedrive') {
        const token = await getValidOneDriveToken(row);
        try { thumbUrl = await oneDriveThumb(token, fileId); } catch { /* non-fatal */ }
      }

      await pool.query(
        `INSERT INTO photos (event_id, guest_name, drive_file_id, thumbnail_url)
         VALUES ($1, $2, $3, $4)`,
        [row.event_id, guestName, fileId, thumbUrl],
      );

      res.status(201).json({ success: true, file: { fileId, thumbnailUrl: thumbUrl } });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
