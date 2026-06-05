/**
 * Verifies a Supabase-issued JWT using the project's JWT secret.
 * No extra dependencies — uses Node's built-in crypto module.
 *
 * Sets req.user = { authId, email, name, provider } on success.
 */
const crypto = require('crypto');

function verifyJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [headerB64, payloadB64, sigB64] = parts;

  // Verify signature
  const expected = crypto
    .createHmac('sha256', process.env.SUPABASE_JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  if (expected !== sigB64) throw new Error('Invalid JWT signature');

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

  if (payload.exp && payload.exp * 1000 < Date.now()) throw new Error('JWT expired');

  return payload;
}

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  // Also accept token as a query param for browser-redirect OAuth initiates
  const raw = header.startsWith('Bearer ')
    ? header.slice(7)
    : (req.query.token ?? '');

  if (!raw) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = verifyJWT(raw);

    req.user = {
      authId:   payload.sub,
      email:    payload.email ?? '',
      name:     payload.user_metadata?.full_name ?? payload.user_metadata?.name ?? '',
      provider: payload.app_metadata?.provider ?? 'email',
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
