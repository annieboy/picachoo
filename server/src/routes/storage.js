const router      = require('express').Router();
const pool        = require('../config/db');
const requireAuth = require('../middleware/requireAuth');
const { getValidAccessToken }    = require('../services/googleTokenService');
const { getValidDropboxToken }   = require('../services/dropboxTokenService');
const { getValidOneDriveToken }  = require('../services/oneDriveTokenService');
const { buildDriveClient }       = require('../services/driveService');

// ── Helpers ───────────────────────────────────────────────────────────────────

function bytes(n) { return typeof n === 'number' ? n : parseInt(n ?? '0', 10); }

function formatBytes(b) {
  if (b >= 1e12) return `${(b / 1e12).toFixed(1)} TB`;
  if (b >= 1e9)  return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6)  return `${(b / 1e6).toFixed(0)} MB`;
  return `${Math.round(b / 1e3)} KB`;
}

function quotaSummary(used, total) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return {
    used,  total,
    usedFmt:  formatBytes(used),
    totalFmt: total > 0 ? formatBytes(total) : 'Unlimited',
    pct,
    // warning levels drive the UI colour
    level: pct >= 95 ? 'critical' : pct >= 80 ? 'warning' : 'ok',
  };
}

// ── Provider quota fetchers ───────────────────────────────────────────────────

async function googleStorageInfo(row, event) {
  const token       = await getValidAccessToken(row);
  const driveClient = buildDriveClient(token);

  const [aboutRes, folderRes] = await Promise.all([
    driveClient.about.get({ fields: 'storageQuota' }),
    // Fetch the folder's webViewLink so we can link straight to it
    event.drive_folder_id
      ? driveClient.files.get({ fileId: event.drive_folder_id, fields: 'id,webViewLink' })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const q = aboutRes.data.storageQuota ?? {};
  // Google reports total storage across Drive + Gmail + Photos
  const used  = bytes(q.usageInDrive);
  const total = bytes(q.limit);      // 0 means unlimited (Workspace)

  return {
    ...quotaSummary(used, total),
    folderUrl: folderRes?.data?.webViewLink ?? 'https://drive.google.com/drive/my-drive',
    provider:  'google_drive',
  };
}

async function dropboxStorageInfo(row, event) {
  const token = await getValidDropboxToken(row);

  const res = await fetch('https://api.dropboxapi.com/2/users/get_space_usage', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    null,
  });
  const data = await res.json();

  const used  = bytes(data?.used);
  const total = bytes(data?.allocation?.allocated ?? data?.allocation?.amount ?? 0);

  // Build folder URL from the cached path (stored in drive_folder_id)
  const folderPath = event.drive_folder_id ?? '/Picachoo';
  const folderUrl  = `https://www.dropbox.com/home${folderPath}`;

  return { ...quotaSummary(used, total), folderUrl, provider: 'dropbox' };
}

async function oneDriveStorageInfo(row, event) {
  const token = await getValidOneDriveToken(row);

  const [driveRes, folderRes] = await Promise.all([
    fetch('https://graph.microsoft.com/v1.0/me/drive?$select=quota', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
    event.drive_folder_id
      ? fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${event.drive_folder_id}?$select=webUrl`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).catch(() => null)
      : Promise.resolve(null),
  ]);

  const q    = driveRes?.quota ?? {};
  const used  = bytes(q.used);
  const total = bytes(q.total);

  return {
    ...quotaSummary(used, total),
    folderUrl: folderRes?.webUrl ?? 'https://onedrive.live.com',
    provider:  'onedrive',
  };
}

// ── GET /api/storage/:eventId/info ────────────────────────────────────────────
// Returns normalised quota + folder URL for whichever provider is linked.
router.get('/:eventId/info', requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Verify ownership and fetch everything in one query
    const { rows } = await pool.query(
      `SELECT
         e.id              AS event_id,
         e.drive_folder_id,
         ct.provider,
         ct.access_token_enc,
         ct.refresh_token_enc,
         ct.token_expires_at,
         ct.id
       FROM events e
       JOIN cloud_tokens ct ON ct.event_id = e.id
       JOIN hosts h ON h.id = e.host_id
       WHERE e.id = $1 AND h.auth_id = $2
       ORDER BY ct.updated_at DESC
       LIMIT 1`,
      [eventId, req.user.authId],
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Event not found or no storage linked' });
    }

    const row   = rows[0];
    const event = { id: row.event_id, drive_folder_id: row.drive_folder_id };

    let info;
    if      (row.provider === 'google_drive') info = await googleStorageInfo(row, event);
    else if (row.provider === 'dropbox')      info = await dropboxStorageInfo(row, event);
    else if (row.provider === 'onedrive')     info = await oneDriveStorageInfo(row, event);
    else return res.status(400).json({ error: `Unknown provider: ${row.provider}` });

    res.json({ storage: info });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
