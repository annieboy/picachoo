const { OAuth2Client } = require('google-auth-library');
const { encrypt, decrypt } = require('../config/crypto');
const pool = require('../config/db');

/**
 * Returns a valid access token for the given cloud_tokens row, refreshing
 * automatically if the token has expired (or will expire within 60 seconds).
 *
 * Uses a fresh OAuth2Client per call so concurrent refreshes for different
 * events cannot clobber each other's credentials on a shared singleton.
 *
 * Persists the new access token back to the database so the next call hits
 * the fast path.
 *
 * @param {object} tokenRow - A row (or row-shaped object) from cloud_tokens.
 *   Required fields: id, access_token_enc, refresh_token_enc, token_expires_at
 * @returns {Promise<string>} A live access token string
 */
async function getValidAccessToken(tokenRow) {
  const expiresAt = tokenRow.token_expires_at
    ? new Date(tokenRow.token_expires_at)
    : null;
  const nowPlusBuffer = new Date(Date.now() + 60 * 1000); // 60-second safety buffer

  // Fast path: token is still valid.
  if (expiresAt && expiresAt > nowPlusBuffer) {
    return decrypt(tokenRow.access_token_enc);
  }

  // Slow path: token is expired or expiry is unknown — refresh it.
  if (!tokenRow.refresh_token_enc) {
    const err = new Error(
      'Access token is expired and no refresh token is stored. The host must re-authorize.',
    );
    err.status = 401;
    throw err;
  }

  const refreshToken = decrypt(tokenRow.refresh_token_enc);

  // Fresh client per refresh — avoids credential clobbering on the singleton
  // if two events refresh concurrently.
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Google did not return a new access token during refresh.');
  }

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
 * Fetches the cloud_tokens row for a given event + provider from the
 * database, then delegates to getValidAccessToken.
 *
 * Use this when you only have an eventId and haven't already loaded the
 * token row.  If the caller already has the row (e.g. from a JOIN), call
 * getValidAccessToken directly to avoid a redundant query.
 *
 * @param {string} eventId
 * @param {string} [provider='google_drive']
 * @returns {Promise<string>} A live access token string
 */
async function getTokenForEvent(eventId, provider = 'google_drive') {
  const { rows } = await pool.query(
    `SELECT id, access_token_enc, refresh_token_enc, token_expires_at
       FROM cloud_tokens
      WHERE event_id = $1 AND provider = $2`,
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
