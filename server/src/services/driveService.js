const { drive: createDrive } = require('@googleapis/drive');
const { OAuth2Client } = require('google-auth-library');
const { Readable } = require('stream');
const pool = require('../config/db');

/**
 * Returns an authenticated Drive v3 client for the given access token.
 */
function buildDriveClient(accessToken) {
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  return createDrive({ version: 'v3', auth });
}

/**
 * Finds an existing Drive folder by name inside a parent, or returns null.
 * Uses the narrowest possible query so we never read files we didn't create
 * (safe because the token scope is drive.file).
 */
async function findFolder(driveClient, name, parentId) {
  // Escape single quotes in the folder name to avoid query injection.
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const query = [
    `name = '${safeName}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    parentId ? `'${parentId}' in parents` : `'root' in parents`,
  ].join(' and ');

  const res = await driveClient.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 1,
  });

  return res.data.files?.[0] ?? null;
}

/**
 * Creates a Drive folder and returns its id.
 */
async function createFolder(driveClient, name, parentId) {
  const res = await driveClient.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId ?? 'root'],
    },
    fields: 'id',
  });
  return res.data.id;
}

/**
 * Returns the Drive folder ID for this event's photo album, creating it on
 * the first call and caching the ID in events.drive_folder_id thereafter.
 *
 * Uses a DB-level advisory lock (via the event's UUID cast to bigint) so
 * concurrent first uploads don't race to create duplicate folders.
 *
 * @param {object} driveClient - Authenticated Drive client
 * @param {object} event       - Row from the events table (needs id, name)
 * @returns {string} Google Drive folder ID
 */
async function getOrCreateEventFolder(driveClient, event) {
  // Fast path: folder already created and cached.
  if (event.drive_folder_id) return event.drive_folder_id;

  // Slow path: take a lightweight advisory lock on this event's ID, then
  // re-check the DB in case another concurrent request already created it.
  const lockKey = BigInt('0x' + event.id.replace(/-/g, '')).toString().slice(0, 18);

  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [lockKey]);

    const { rows } = await client.query(
      'SELECT drive_folder_id FROM events WHERE id = $1',
      [event.id],
    );
    if (rows[0]?.drive_folder_id) {
      return rows[0].drive_folder_id;
    }

    // Folder doesn't exist yet — create it in Drive.
    const folderName = `Picachoo — ${event.name}`;
    let folderId;

    // Check whether it already exists in Drive (e.g. server restarted after
    // creating the folder but before writing the id back to the DB).
    const existing = await findFolder(driveClient, folderName, null);
    folderId = existing ? existing.id : await createFolder(driveClient, folderName, null);

    await client.query(
      'UPDATE events SET drive_folder_id = $1 WHERE id = $2',
      [folderId, event.id],
    );

    return folderId;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [lockKey]);
    client.release();
  }
}

/**
 * Uploads a Buffer to Google Drive inside the given folder.
 *
 * @param {object} driveClient
 * @param {Buffer} buffer       - Raw image bytes
 * @param {string} filename     - Final filename, e.g. "Alice_2024-06-01T12-00-00.jpg"
 * @param {string} mimeType     - e.g. "image/jpeg"
 * @param {string} folderId     - Parent Drive folder ID
 * @returns {object}            - { id, name, webViewLink }
 */
async function uploadFile(driveClient, buffer, filename, mimeType, folderId) {
  const res = await driveClient.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, name, webViewLink',
  });
  return res.data;
}

module.exports = { buildDriveClient, getOrCreateEventFolder, uploadFile };
