const router      = require('express').Router();
const crypto      = require('crypto');
const { oauth2Client, DRIVE_SCOPE } = require('../config/googleOAuth');
const { encrypt, decrypt } = require('../config/crypto');
const pool        = require('../config/db');
const requireAuth = require('../middleware/requireAuth');
const { getCurrentAccountEmail } = require('../services/dropboxService');
const { getCurrentUserEmail }    = require('../services/oneDriveService');

// ── DB-backed OAuth state ─────────────────────────────────────────────────────
// Stored in the oauth_states table — survives serverless cold starts and works
// across multiple Vercel function instances. Expires after 10 minutes.

async function createState({ hostId, eventId, provider }) {
  const state = crypto.randomBytes(24).toString('hex');
  await pool.query(
    `INSERT INTO oauth_states (state, host_id, event_id, provider)
     VALUES ($1, $2, $3, $4)`,
    [state, hostId, eventId, provider],
  );
  // Best-effort cleanup of expired rows on each write
  pool.query(`DELETE FROM oauth_states WHERE expires_at < NOW()`).catch(() => {});
  return state;
}

async function consumeState(state) {
  const { rows } = await pool.query(
    `DELETE FROM oauth_states
     WHERE state = $1 AND expires_at > NOW()
     RETURNING host_id, event_id, provider`,
    [state],
  );
  return rows[0] ?? null;
}

// ── Ownership guard ───────────────────────────────────────────────────────────
// Returns hostId (DB UUID) after verifying the JWT user owns the event.
async function assertEventOwnership(authId, eventId) {
  const { rows } = await pool.query(
    `SELECT h.id AS host_id
       FROM hosts h
       JOIN events e ON e.host_id = h.id
      WHERE h.auth_id = $1 AND e.id = $2`,
    [authId, eventId],
  );
  if (!rows.length) throw Object.assign(new Error('Event not found or access denied'), { status: 403 });
  return rows[0].host_id;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OAuth initiation — single endpoint for all providers
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/auth/oauth-init ────────────────────────────────────────────────
// JWT arrives in the Authorization header (never in the URL).
// Returns { redirectUrl } — the provider OAuth URL the client should navigate to.
router.post('/oauth-init', requireAuth, async (req, res, next) => {
  try {
    const { provider, eventId, loginHint } = req.body;
    if (!provider || !eventId) {
      return next(Object.assign(new Error('provider and eventId are required'), { status: 400 }));
    }
    if (!['google', 'dropbox', 'onedrive'].includes(provider)) {
      return next(Object.assign(new Error('Invalid provider'), { status: 400 }));
    }

    const hostId = await assertEventOwnership(req.user.authId, eventId);
    const state  = await createState({ hostId, eventId, provider });

    let redirectUrl;

    if (provider === 'google') {
      redirectUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope:       DRIVE_SCOPE,
        state,
        prompt:      'consent',
        ...(loginHint ? { login_hint: loginHint } : {}),
      });
    } else if (provider === 'dropbox') {
      const params = new URLSearchParams({
        client_id:         process.env.DROPBOX_APP_KEY,
        response_type:     'code',
        redirect_uri:      dropboxRedirectUri(),
        state,
        token_access_type: 'offline',
      });
      redirectUrl = `${DROPBOX_AUTH_URL}?${params}`;
    } else if (provider === 'onedrive') {
      const params = new URLSearchParams({
        client_id:     process.env.ONEDRIVE_CLIENT_ID,
        response_type: 'code',
        redirect_uri:  oneDriveRedirectUri(),
        scope:         ONEDRIVE_SCOPE,
        state,
        response_mode: 'query',
        prompt:        'consent',
      });
      redirectUrl = `${ONEDRIVE_AUTH_URL}?${params}`;
    }

    res.json({ redirectUrl });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Google Drive
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/auth/google — kept for backwards compatibility only ─────────────
router.get('/google', requireAuth, async (req, res, next) => {
  try {
    const { eventId, loginHint } = req.query;
    if (!eventId) return next(Object.assign(new Error('eventId is required'), { status: 400 }));

    const hostId = await assertEventOwnership(req.user.authId, eventId);
    const state  = await createState({ hostId, eventId, provider: 'google' });

    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope:       DRIVE_SCOPE,
      state,
      prompt:      'consent',
      ...(loginHint ? { login_hint: loginHint } : {}),
    });

    res.redirect(authorizeUrl);
  } catch (err) { next(err); }
});

// ─── GET /api/auth/google/callback ───────────────────────────────────────────
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) return res.redirect(`${process.env.CLIENT_ORIGIN}/dashboard?error=google_auth_denied`);
    if (!code || !state) return next(Object.assign(new Error('Missing code or state'), { status: 400 }));

    const payload = await consumeState(state);
    if (!payload) return next(Object.assign(new Error('Invalid or expired state'), { status: 400 }));

    const { host_id: hostId, event_id: eventId } = payload;

    const { tokens }   = await oauth2Client.getToken(code);
    if (!tokens.access_token) throw new Error('Google did not return an access token');

    oauth2Client.setCredentials(tokens);
    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);

    await pool.query(
      `INSERT INTO cloud_tokens
         (host_id, event_id, provider, access_token_enc, refresh_token_enc,
          token_expires_at, provider_account_email)
       VALUES ($1, $2, 'google_drive', $3, $4, $5, $6)
       ON CONFLICT (event_id, provider) DO UPDATE SET
         access_token_enc       = EXCLUDED.access_token_enc,
         refresh_token_enc      = COALESCE(EXCLUDED.refresh_token_enc, cloud_tokens.refresh_token_enc),
         token_expires_at       = EXCLUDED.token_expires_at,
         provider_account_email = EXCLUDED.provider_account_email,
         updated_at             = NOW()`,
      [hostId, eventId, encrypt(tokens.access_token),
       tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
       tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
       tokenInfo.email ?? null],
    );

    res.redirect(`${process.env.CLIENT_ORIGIN}/dashboard?linked=google`);
  } catch (err) { next(err); }
});

// ─── POST /api/auth/google/link-from-session ──────────────────────────────────
// Auto-links Google Drive using the provider tokens Supabase captures during
// Google sign-in (when drive.file scope is requested). Called by the frontend
// immediately after creating an event.
router.post('/google/link-from-session', requireAuth, async (req, res, next) => {
  try {
    const { eventId, accessToken, refreshToken, expiryDate } = req.body;

    if (!eventId || !accessToken) {
      return next(Object.assign(new Error('eventId and accessToken are required'), { status: 400 }));
    }

    const hostId = await assertEventOwnership(req.user.authId, eventId);

    // Fetch the Google account email for display
    let accountEmail = null;
    try {
      oauth2Client.setCredentials({ access_token: accessToken });
      const info = await oauth2Client.getTokenInfo(accessToken);
      accountEmail = info.email ?? null;
    } catch { /* non-fatal */ }

    const expiresAt = expiryDate ? new Date(expiryDate).toISOString() : null;

    await pool.query(
      `INSERT INTO cloud_tokens
         (host_id, event_id, provider, access_token_enc, refresh_token_enc,
          token_expires_at, provider_account_email)
       VALUES ($1, $2, 'google_drive', $3, $4, $5, $6)
       ON CONFLICT (event_id, provider) DO UPDATE SET
         access_token_enc       = EXCLUDED.access_token_enc,
         refresh_token_enc      = COALESCE(EXCLUDED.refresh_token_enc, cloud_tokens.refresh_token_enc),
         token_expires_at       = EXCLUDED.token_expires_at,
         provider_account_email = EXCLUDED.provider_account_email,
         updated_at             = NOW()`,
      [hostId, eventId, encrypt(accessToken),
       refreshToken ? encrypt(refreshToken) : null,
       expiresAt, accountEmail],
    );

    res.json({ success: true, provider: 'google_drive', email: accountEmail });
  } catch (err) { next(err); }
});

// ─── DELETE /api/auth/google ──────────────────────────────────────────────────
router.delete('/google', requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return next(Object.assign(new Error('eventId is required'), { status: 400 }));

    await assertEventOwnership(req.user.authId, eventId);

    const { rows } = await pool.query(
      `DELETE FROM cloud_tokens
        WHERE event_id = $1 AND provider = 'google_drive'
       RETURNING access_token_enc`,
      [eventId],
    );
    if (!rows.length) return next(Object.assign(new Error('No Google Drive token found'), { status: 404 }));

    try { await oauth2Client.revokeToken(decrypt(rows[0].access_token_enc)); } catch { /* non-fatal */ }

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Dropbox
// ═══════════════════════════════════════════════════════════════════════════════

const DROPBOX_AUTH_URL  = 'https://www.dropbox.com/oauth2/authorize';
const DROPBOX_TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';

function dropboxRedirectUri() {
  return `${process.env.API_BASE_URL ?? process.env.CLIENT_ORIGIN}/api/auth/dropbox/callback`;
}


router.get('/dropbox/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) return res.redirect(`${process.env.CLIENT_ORIGIN}/dashboard?error=dropbox_auth_denied`);
    if (!code || !state) return next(Object.assign(new Error('Missing code or state'), { status: 400 }));

    const payload = await consumeState(state);
    if (!payload) return next(Object.assign(new Error('Invalid or expired state'), { status: 400 }));

    const { host_id: hostId, event_id: eventId } = payload;

    const creds = Buffer.from(`${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`).toString('base64');
    const tokenRes = await fetch(DROPBOX_TOKEN_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: dropboxRedirectUri() }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(`Dropbox token exchange failed: ${tokens?.error_description ?? JSON.stringify(tokens)}`);
    }

    const accountEmail = await getCurrentAccountEmail(tokens.access_token).catch(() => null);
    const expiresAt    = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null;

    await pool.query(
      `INSERT INTO cloud_tokens
         (host_id, event_id, provider, access_token_enc, refresh_token_enc,
          token_expires_at, provider_account_email)
       VALUES ($1, $2, 'dropbox', $3, $4, $5, $6)
       ON CONFLICT (event_id, provider) DO UPDATE SET
         access_token_enc       = EXCLUDED.access_token_enc,
         refresh_token_enc      = COALESCE(EXCLUDED.refresh_token_enc, cloud_tokens.refresh_token_enc),
         token_expires_at       = EXCLUDED.token_expires_at,
         provider_account_email = EXCLUDED.provider_account_email,
         updated_at             = NOW()`,
      [hostId, eventId, encrypt(tokens.access_token),
       tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
       expiresAt, accountEmail],
    );

    res.redirect(`${process.env.CLIENT_ORIGIN}/dashboard?linked=dropbox`);
  } catch (err) { next(err); }
});

router.delete('/dropbox', requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return next(Object.assign(new Error('eventId is required'), { status: 400 }));
    await assertEventOwnership(req.user.authId, eventId);

    const { rows } = await pool.query(
      `DELETE FROM cloud_tokens WHERE event_id = $1 AND provider = 'dropbox' RETURNING id`,
      [eventId],
    );
    if (!rows.length) return next(Object.assign(new Error('No Dropbox token found'), { status: 404 }));

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OneDrive
// ═══════════════════════════════════════════════════════════════════════════════

const ONEDRIVE_AUTH_URL  = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const ONEDRIVE_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const ONEDRIVE_SCOPE     = 'files.readwrite offline_access User.Read';

function oneDriveRedirectUri() {
  return `${process.env.API_BASE_URL ?? process.env.CLIENT_ORIGIN}/api/auth/onedrive/callback`;
}


router.get('/onedrive/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) return res.redirect(`${process.env.CLIENT_ORIGIN}/dashboard?error=onedrive_auth_denied`);
    if (!code || !state) return next(Object.assign(new Error('Missing code or state'), { status: 400 }));

    const payload = await consumeState(state);
    if (!payload) return next(Object.assign(new Error('Invalid or expired state'), { status: 400 }));

    const { host_id: hostId, event_id: eventId } = payload;

    const tokenRes = await fetch(ONEDRIVE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  oneDriveRedirectUri(),
        client_id:     process.env.ONEDRIVE_CLIENT_ID,
        client_secret: process.env.ONEDRIVE_CLIENT_SECRET,
        scope:         ONEDRIVE_SCOPE,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(`OneDrive token exchange failed: ${tokens?.error_description ?? JSON.stringify(tokens)}`);
    }

    const accountEmail = await getCurrentUserEmail(tokens.access_token).catch(() => null);
    const expiresAt    = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null;

    await pool.query(
      `INSERT INTO cloud_tokens
         (host_id, event_id, provider, access_token_enc, refresh_token_enc,
          token_expires_at, provider_account_email)
       VALUES ($1, $2, 'onedrive', $3, $4, $5, $6)
       ON CONFLICT (event_id, provider) DO UPDATE SET
         access_token_enc       = EXCLUDED.access_token_enc,
         refresh_token_enc      = COALESCE(EXCLUDED.refresh_token_enc, cloud_tokens.refresh_token_enc),
         token_expires_at       = EXCLUDED.token_expires_at,
         provider_account_email = EXCLUDED.provider_account_email,
         updated_at             = NOW()`,
      [hostId, eventId, encrypt(tokens.access_token),
       tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
       expiresAt, accountEmail],
    );

    res.redirect(`${process.env.CLIENT_ORIGIN}/dashboard?linked=onedrive`);
  } catch (err) { next(err); }
});

router.delete('/onedrive', requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return next(Object.assign(new Error('eventId is required'), { status: 400 }));
    await assertEventOwnership(req.user.authId, eventId);

    const { rows } = await pool.query(
      `DELETE FROM cloud_tokens WHERE event_id = $1 AND provider = 'onedrive' RETURNING id`,
      [eventId],
    );
    if (!rows.length) return next(Object.assign(new Error('No OneDrive token found'), { status: 404 }));

    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
