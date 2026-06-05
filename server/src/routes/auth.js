const router = require('express').Router();
const crypto = require('crypto');
const { oauth2Client, DRIVE_SCOPE } = require('../config/googleOAuth');
const { encrypt } = require('../config/crypto');
const pool = require('../config/db');
const { getCurrentAccountEmail } = require('../services/dropboxService');

// In production replace this with a proper session store (e.g. express-session
// backed by Redis). For now we use a short-lived in-process Map keyed by the
// CSRF state token, storing the host and event context for the callback.
const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function createState(payload) {
  const state = crypto.randomBytes(24).toString('hex');
  pendingStates.set(state, { ...payload, createdAt: Date.now() });
  // Auto-expire to avoid memory growth
  setTimeout(() => pendingStates.delete(state), STATE_TTL_MS);
  return state;
}

function consumeState(state) {
  const payload = pendingStates.get(state);
  pendingStates.delete(state);
  if (!payload) return null;
  if (Date.now() - payload.createdAt > STATE_TTL_MS) return null;
  return payload;
}

// ─── GET /api/auth/google ──────────────────────────────────────────────────────
// Initiates the OAuth flow. Expects query params:
//   hostId  - UUID of the host starting the flow
//   eventId - UUID of the event they're linking storage to
//
// Example: GET /api/auth/google?hostId=<uuid>&eventId=<uuid>
router.get('/google', (req, res, next) => {
  try {
    const { hostId, eventId } = req.query;

    if (!hostId || !eventId) {
      const err = new Error('hostId and eventId query parameters are required');
      err.status = 400;
      return next(err);
    }

    // CSRF state token ties this redirect to the specific host+event so the
    // callback cannot be replayed or hijacked with a different context.
    const state = createState({ hostId, eventId });

    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',  // request a refresh token
      scope: DRIVE_SCOPE,
      state,
      prompt: 'consent',       // always show consent screen so we always get a refresh token
    });

    res.redirect(authorizeUrl);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/google/callback ────────────────────────────────────────────
// Google redirects here after the host approves (or denies) access.
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    // Host denied access on the Google consent screen.
    if (error) {
      return res.redirect(
        `${process.env.CLIENT_ORIGIN}/dashboard?error=google_auth_denied`,
      );
    }

    if (!code || !state) {
      const err = new Error('Missing code or state parameter');
      err.status = 400;
      return next(err);
    }

    // Validate CSRF state and recover the host+event context.
    const payload = consumeState(state);
    if (!payload) {
      const err = new Error('Invalid or expired state parameter');
      err.status = 400;
      return next(err);
    }

    const { hostId, eventId } = payload;

    // Verify the host and event actually exist and belong together.
    const eventCheck = await pool.query(
      `SELECT id FROM events WHERE id = $1 AND host_id = $2`,
      [eventId, hostId],
    );
    if (!eventCheck.rows.length) {
      const err = new Error('Event not found or does not belong to this host');
      err.status = 403;
      return next(err);
    }

    // Exchange the one-time authorization code for access + refresh tokens.
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('Google did not return an access token');
    }

    // Fetch the Google account info for display purposes (email, account id).
    oauth2Client.setCredentials(tokens);
    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);

    // Encrypt both tokens before touching the database.
    const accessTokenEnc = encrypt(tokens.access_token);
    const refreshTokenEnc = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

    // Upsert: if the host re-authorizes the same event we replace the old row.
    await pool.query(
      `INSERT INTO cloud_tokens
         (host_id, event_id, provider,
          access_token_enc, refresh_token_enc, token_expires_at,
          provider_account_email)
       VALUES ($1, $2, 'google_drive', $3, $4, $5, $6)
       ON CONFLICT (event_id, provider)
       DO UPDATE SET
         access_token_enc     = EXCLUDED.access_token_enc,
         refresh_token_enc    = COALESCE(EXCLUDED.refresh_token_enc, cloud_tokens.refresh_token_enc),
         token_expires_at     = EXCLUDED.token_expires_at,
         provider_account_email = EXCLUDED.provider_account_email,
         updated_at           = NOW()`,
      [
        hostId,
        eventId,
        accessTokenEnc,
        refreshTokenEnc,
        expiresAt,
        tokenInfo.email ?? null,
      ],
    );

    // Return the host to their dashboard. The frontend can detect success via
    // the `linked=google` query param and show a confirmation toast.
    res.redirect(
      `${process.env.CLIENT_ORIGIN}/dashboard?linked=google&eventId=${eventId}`,
    );
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/auth/google ───────────────────────────────────────────────────
// Lets a host revoke and remove their Google Drive link for an event.
// Body: { hostId, eventId }
router.delete('/google', async (req, res, next) => {
  try {
    const { hostId, eventId } = req.body;

    if (!hostId || !eventId) {
      const err = new Error('hostId and eventId are required');
      err.status = 400;
      return next(err);
    }

    const { rows } = await pool.query(
      `DELETE FROM cloud_tokens
        WHERE event_id = $1 AND host_id = $2 AND provider = 'google_drive'
       RETURNING access_token_enc`,
      [eventId, hostId],
    );

    if (!rows.length) {
      const err = new Error('No Google Drive token found for this event');
      err.status = 404;
      return next(err);
    }

    // Best-effort: revoke the token at Google so the app disappears from the
    // host's "Third-party apps" page. Failure here is non-fatal.
    try {
      const { decrypt } = require('../config/crypto');
      await oauth2Client.revokeToken(decrypt(rows[0].access_token_enc));
    } catch {
      // Token may already be expired — revocation failure is harmless.
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Dropbox OAuth
// ═══════════════════════════════════════════════════════════════════════════════

const DROPBOX_AUTH_URL  = 'https://www.dropbox.com/oauth2/authorize';
const DROPBOX_TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';

function dropboxRedirectUri() {
  // Must exactly match the URI registered in the Dropbox App Console.
  return `${process.env.API_BASE_URL ?? process.env.CLIENT_ORIGIN}/api/auth/dropbox/callback`;
}

// ─── GET /api/auth/dropbox ────────────────────────────────────────────────────
router.get('/dropbox', (req, res, next) => {
  try {
    const { hostId, eventId } = req.query;
    if (!hostId || !eventId) {
      const err = new Error('hostId and eventId query parameters are required');
      err.status = 400;
      return next(err);
    }

    const state = createState({ hostId, eventId, provider: 'dropbox' });
    const params = new URLSearchParams({
      client_id:            process.env.DROPBOX_APP_KEY,
      response_type:        'code',
      redirect_uri:         dropboxRedirectUri(),
      state,
      token_access_type:    'offline',  // request a long-lived refresh token
    });

    res.redirect(`${DROPBOX_AUTH_URL}?${params}`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/dropbox/callback ──────────────────────────────────────────
router.get('/dropbox/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(
        `${process.env.CLIENT_ORIGIN}/dashboard?error=dropbox_auth_denied`,
      );
    }

    if (!code || !state) {
      const err = new Error('Missing code or state parameter');
      err.status = 400;
      return next(err);
    }

    const payload = consumeState(state);
    if (!payload) {
      const err = new Error('Invalid or expired state parameter');
      err.status = 400;
      return next(err);
    }

    const { hostId, eventId } = payload;

    const eventCheck = await pool.query(
      `SELECT id FROM events WHERE id = $1 AND host_id = $2`,
      [eventId, hostId],
    );
    if (!eventCheck.rows.length) {
      const err = new Error('Event not found or does not belong to this host');
      err.status = 403;
      return next(err);
    }

    // Exchange code for tokens
    const creds = Buffer.from(
      `${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`,
    ).toString('base64');

    const tokenRes = await fetch(DROPBOX_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: dropboxRedirectUri(),
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(`Dropbox token exchange failed: ${tokens?.error_description ?? JSON.stringify(tokens)}`);
    }

    // Fetch the linked Dropbox account email
    const accountEmail = await getCurrentAccountEmail(tokens.access_token).catch(() => null);

    const accessTokenEnc  = encrypt(tokens.access_token);
    const refreshTokenEnc = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    // Dropbox short-lived tokens expire in 4 hours
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await pool.query(
      `INSERT INTO cloud_tokens
         (host_id, event_id, provider,
          access_token_enc, refresh_token_enc, token_expires_at,
          provider_account_email)
       VALUES ($1, $2, 'dropbox', $3, $4, $5, $6)
       ON CONFLICT (event_id, provider)
       DO UPDATE SET
         access_token_enc       = EXCLUDED.access_token_enc,
         refresh_token_enc      = COALESCE(EXCLUDED.refresh_token_enc, cloud_tokens.refresh_token_enc),
         token_expires_at       = EXCLUDED.token_expires_at,
         provider_account_email = EXCLUDED.provider_account_email,
         updated_at             = NOW()`,
      [hostId, eventId, accessTokenEnc, refreshTokenEnc, expiresAt, accountEmail],
    );

    res.redirect(
      `${process.env.CLIENT_ORIGIN}/dashboard?linked=dropbox&eventId=${eventId}`,
    );
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/auth/dropbox ─────────────────────────────────────────────────
router.delete('/dropbox', async (req, res, next) => {
  try {
    const { hostId, eventId } = req.body;
    if (!hostId || !eventId) {
      const err = new Error('hostId and eventId are required');
      err.status = 400;
      return next(err);
    }

    const { rows } = await pool.query(
      `DELETE FROM cloud_tokens
        WHERE event_id = $1 AND host_id = $2 AND provider = 'dropbox'
       RETURNING id`,
      [eventId, hostId],
    );

    if (!rows.length) {
      const err = new Error('No Dropbox token found for this event');
      err.status = 404;
      return next(err);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
