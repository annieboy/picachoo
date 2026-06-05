const pool = require('../config/db');

const GRAPH = 'https://graph.microsoft.com/v1.0/me/drive';

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function graphRequest(url, token, { method = 'GET', body, extraHeaders = {} } = {}) {
  const headers = { ...authHeader(token), ...extraHeaders };
  if (body && typeof body === 'object' && !(body instanceof Buffer)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body instanceof Buffer ? body : body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Graph API error ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`);
  }
  return data;
}

/** Sanitize for use as a OneDrive folder/file name component. */
function safeName(name) {
  // OneDrive forbids: " * : < > ? / \ |
  return name.replace(/["\*:<>?/\\|]/g, '_').trim().slice(0, 100) || 'Event';
}

// ── Folder ────────────────────────────────────────────────────────────────────

/**
 * Gets or creates /Picachoo/<EventName> in the user's OneDrive.
 * Stores the folder item ID in drive_folder_id for caching.
 */
async function getOrCreateEventFolder(token, event) {
  if (event.drive_folder_id) return event.drive_folder_id;

  const folderName = safeName(event.name);

  // Ensure the root /Picachoo container exists first
  await ensureFolder(token, 'root', 'Picachoo');

  // Then create / get the event subfolder inside it
  const folder = await ensureFolder(token, 'root:/Picachoo:', folderName);

  await pool.query(
    'UPDATE events SET drive_folder_id = $1 WHERE id = $2',
    [folder.id, event.id],
  );

  return folder.id;
}

async function ensureFolder(token, parentRef, name) {
  const url = `${GRAPH}/${parentRef}/children`;
  try {
    return await graphRequest(url, token, {
      method: 'POST',
      body: {
        name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail', // fail fast if it exists
      },
    });
  } catch (err) {
    if (err.message.includes('nameAlreadyExists') || err.message.includes('409')) {
      // Folder exists — fetch it
      return graphRequest(
        `${GRAPH}/${parentRef}:/${encodeURIComponent(name)}:`,
        token,
      );
    }
    throw err;
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * Uploads a Buffer into the given folder (by item ID) and returns the item.
 * Uses the simple upload API (≤4 MB, which is our Vercel limit anyway).
 */
async function uploadFile(token, buffer, filename, mimeType, folderId) {
  const url = `${GRAPH}/items/${folderId}:/${encodeURIComponent(filename)}:/content`;
  return graphRequest(url, token, {
    method: 'PUT',
    body: buffer,
    extraHeaders: { 'Content-Type': mimeType || 'application/octet-stream' },
  });
}

// ── Sharing link → embeddable thumbnail URL ───────────────────────────────────

/**
 * Creates an anonymous view link for the item and converts it to a direct
 * image URL using the Microsoft Graph Shares API.
 *
 * Direct URL format (no auth required):
 *   https://api.onedrive.com/v1.0/shares/u!{base64url(webUrl)}/root/content
 */
async function getPublicThumbnailUrl(token, itemId) {
  const data = await graphRequest(
    `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/createLink`,
    token,
    {
      method: 'POST',
      body: { type: 'view', scope: 'anonymous' },
    },
  );

  const webUrl = data?.link?.webUrl;
  if (!webUrl) throw new Error('OneDrive did not return a sharing link');

  // Encode the sharing URL so we can use the Shares API for direct access
  const encoded = Buffer.from(webUrl).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `https://api.onedrive.com/v1.0/shares/u!${encoded}/root/content`;
}

// ── Direct upload session (bypasses Vercel body size limit) ──────────────────

/**
 * Creates an OneDrive upload session for direct browser-to-OneDrive upload.
 * The returned uploadUrl contains an embedded SAS token — no Authorization
 * header needed when the browser PUTs the file directly to this URL.
 * Sessions expire after ~15 minutes if unused.
 *
 * @param {string} token    - Valid OneDrive access token (server-side only)
 * @param {string} filename - Desired file name in OneDrive
 * @param {string} folderId - OneDrive item ID of the target folder
 * @returns {Promise<string>} Direct upload URL for the client to PUT to
 */
async function createUploadSession(token, filename, folderId) {
  const url = `${GRAPH}/items/${folderId}:/${encodeURIComponent(filename)}:/createUploadSession`;
  const data = await graphRequest(url, token, {
    method: 'POST',
    body: {
      item: {
        '@microsoft.graph.conflictBehavior': 'rename',
        name: filename,
      },
      deferCommit: false,
    },
  });
  if (!data?.uploadUrl) throw new Error('OneDrive did not return an uploadUrl');
  return data.uploadUrl;
}

// ── Current user ──────────────────────────────────────────────────────────────

async function getCurrentUserEmail(token) {
  const data = await graphRequest('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', token);
  return data?.mail ?? data?.userPrincipalName ?? null;
}

module.exports = {
  getOrCreateEventFolder,
  uploadFile,
  createUploadSession,
  getPublicThumbnailUrl,
  getCurrentUserEmail,
};
