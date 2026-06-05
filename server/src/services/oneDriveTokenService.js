const { decrypt, encrypt } = require('../config/crypto');
const pool = require('../config/db');

const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

async function refreshOneDriveToken(row) {
  const refreshToken = decrypt(row.refresh_token_enc);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     process.env.ONEDRIVE_CLIENT_ID,
      client_secret: process.env.ONEDRIVE_CLIENT_SECRET,
      scope:         'files.readwrite offline_access User.Read',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`OneDrive token refresh failed: ${data?.error_description ?? JSON.stringify(data)}`);
  }

  const newExpiry        = new Date(Date.now() + data.expires_in * 1000).toISOString();
  const newAccessEnc     = encrypt(data.access_token);
  const newRefreshEnc    = data.refresh_token ? encrypt(data.refresh_token) : null;

  await pool.query(
    `UPDATE cloud_tokens
        SET access_token_enc  = $1,
            refresh_token_enc = COALESCE($2, refresh_token_enc),
            token_expires_at  = $3
      WHERE id = $4`,
    [newAccessEnc, newRefreshEnc, newExpiry, row.id],
  );

  return data.access_token;
}

async function getValidOneDriveToken(row) {
  const expiresAt  = row.token_expires_at ? new Date(row.token_expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 60_000;

  if (!needsRefresh) return decrypt(row.access_token_enc);

  if (!row.refresh_token_enc) {
    throw new Error('OneDrive refresh token missing — host must re-authorise');
  }

  return refreshOneDriveToken(row);
}

module.exports = { getValidOneDriveToken };
