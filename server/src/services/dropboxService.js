const pool = require('../config/db');

const DBX_API     = 'https://api.dropboxapi.com/2';
const DBX_CONTENT = 'https://content.dropboxapi.com/2';

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function dbxJson(url, token, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Dropbox API error: ${data?.error_summary ?? JSON.stringify(data)}`);
  return data;
}

/** Sanitize an event name for use as a Dropbox path segment. */
function safeName(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim().slice(0, 100) || 'Event';
}

// ── Folder ────────────────────────────────────────────────────────────────────

/**
 * Returns the Dropbox folder path for an event, creating it if necessary.
 * We store the path in drive_folder_id (reusing the existing cache column).
 */
async function getOrCreateEventFolder(token, event) {
  if (event.drive_folder_id) return event.drive_folder_id;

  const folderPath = `/Picachoo/${safeName(event.name)}`;

  try {
    await dbxJson(`${DBX_API}/files/create_folder_v2`, token, {
      path: folderPath,
      autorename: false,
    });
  } catch (err) {
    // Folder already exists — that's fine
    if (!err.message.includes('path/conflict/folder')) throw err;
  }

  await pool.query(
    'UPDATE events SET drive_folder_id = $1 WHERE id = $2',
    [folderPath, event.id],
  );

  return folderPath;
}

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * Uploads a Buffer to a Dropbox folder and returns the file metadata.
 */
async function uploadFile(token, buffer, filename, _mimeType, folderPath) {
  const filePath = `${folderPath}/${filename}`;

  const res = await fetch(`${DBX_CONTENT}/files/upload`, {
    method: 'POST',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: filePath,
        mode: 'add',
        autorename: true,
        mute: false,
      }),
    },
    body: buffer,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Dropbox upload error: ${data?.error_summary ?? JSON.stringify(data)}`);

  return data; // { id, name, path_display, path_lower, ... }
}

// ── Shared link → thumbnail URL ───────────────────────────────────────────────

/**
 * Creates a public shared link for the uploaded file and returns a direct
 * embeddable URL suitable for use as a thumbnail in the photo wall.
 */
async function getPublicThumbnailUrl(token, filePath) {
  let sharedUrl;

  try {
    const data = await dbxJson(
      `${DBX_API}/sharing/create_shared_link_with_settings`,
      token,
      { path: filePath, settings: { requested_visibility: { '.tag': 'public' } } },
    );
    sharedUrl = data.url;
  } catch (err) {
    if (err.message.includes('shared_link_already_exists')) {
      const existing = await dbxJson(
        `${DBX_API}/sharing/list_shared_links`,
        token,
        { path: filePath, direct_only: true },
      );
      sharedUrl = existing.links?.[0]?.url;
      if (!sharedUrl) throw new Error('Could not retrieve existing Dropbox shared link');
    } else {
      throw err;
    }
  }

  // Convert shared link to a raw embeddable URL:
  //   https://www.dropbox.com/scl/fi/.../photo.jpg?rlkey=...&dl=0
  //   → https://dl.dropboxusercontent.com/scl/fi/.../photo.jpg?rlkey=...
  return sharedUrl
    .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
    .replace(/([?&])dl=0/, '$1')
    .replace(/[?&]$/, '');
}

// ── Current account ───────────────────────────────────────────────────────────

async function getCurrentAccountEmail(token) {
  const data = await dbxJson(`${DBX_API}/users/get_current_account`, token, null);
  return data?.email ?? null;
}

module.exports = {
  getOrCreateEventFolder,
  uploadFile,
  getPublicThumbnailUrl,
  getCurrentAccountEmail,
};
