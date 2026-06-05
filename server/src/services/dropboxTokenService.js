const { decrypt, encrypt } = require('../config/crypto');
const pool = require('../config/db');

async function refreshDropboxToken(row) {
  const refreshToken = decrypt(row.refresh_token_enc);
  const creds = Buffer.from(
    `${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`,
  ).toString('base64');

  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Dropbox token refresh failed: ${data?.error_description ?? JSON.stringify(data)}`);
  }

  const newExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString();
  const newAccessTokenEnc = encrypt(data.access_token);

  await pool.query(
    `UPDATE cloud_tokens SET access_token_enc = $1, token_expires_at = $2 WHERE id = $3`,
    [newAccessTokenEnc, newExpiry, row.id],
  );

  return data.access_token;
}

async function getValidDropboxToken(row) {
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 60_000;

  if (!needsRefresh) return decrypt(row.access_token_enc);

  if (!row.refresh_token_enc) {
    throw new Error('Dropbox refresh token missing — host must re-authorise');
  }

  return refreshDropboxToken(row);
}

module.exports = { getValidDropboxToken };
