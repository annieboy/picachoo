const { oauth2Client } = require('../config/googleOAuth');
const { encrypt, decrypt } = require('../config/crypto');
const pool = require('../config/db');

/**
 * Returns a valid access token for the given cloud_tokens row, refreshing
 * automatically if the token has expired (or expires within 60 seconds).
 *
 * Also persists the new access token back to the database so subsequent
 * calls don't re-hit Google unnecessarily.
 *
 * @param {object} tokenRow - A row from the cloud_tokens table
 * @returns {string} A live access token
 */
async function getValidAccessToken(tokenRow) {
  const expiresAt = tokenRow.token_expires_at ? new Date(tokenRow.token_expires_at) : null;
  const nowPlusBuffer = new Date(Date.now() + 60 * 1000); // 60-second buffer

  if (expiresAt && expiresAt > nowPlusBuffer) {
    // Token is still valid — decrypt and return immediately.
    return decrypt(tokenRow.access_token_enc);
  }

  // Token is expired or expiry unknown — use the refresh token.
  if (!tokenRow.refresh_token_enc) {
    throw new Error('Access token expired and no refresh token is available. Host must re-authorize.');
  }

  const refreshToken = decrypt(tokenRow.refresh_token_enc);

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  const newAccessTokenEnc = encrypt(credentials.access_token);
  const newExpiresAt = credentials.expiry_date
    ? new Date(credentials.expiry_date).toISOString()
    : null;

  await pool.query(
    `UPDATE cloud_tokens
        SET access_token_enc = $1,
            token_expires_at = $2
      WHERE id = $3`,
    [newAccessTokenEnc, newExpiresAt, tokenRow.id],
  );

  return credentials.access_token;
}

/**
 * Fetches the cloud_tokens row for a given event + provider, validates it
 * exists, then returns a live access token via getValidAccessToken.
 *
 * @param {string} eventId
 * @param {string} provider  e.g. 'google_drive'
 * @returns {string} A live access token
 */
async function getTokenForEvent(eventId, provider = 'google_drive') {
  const { rows } = await pool.query(
    `SELECT * FROM cloud_tokens WHERE event_id = $1 AND provider = $2`,
    [eventId, provider],
  );

  if (!rows.length) {
    const err = new Error(`No ${provider} token linked to event ${eventId}`);
    err.status = 404;
    throw err;
  }

  return getValidAccessToken(rows[0]);
}

module.exports = { getValidAccessToken, getTokenForEvent };
