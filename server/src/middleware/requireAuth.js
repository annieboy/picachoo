/**
 * Verifies a Supabase JWT by calling supabase.auth.getUser().
 * Works with all signing algorithms (HS256 legacy AND ECC P-256 current).
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */
const { createClient } = require('@supabase/supabase-js');

let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _supabase;
}

module.exports = async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const raw = header.startsWith('Bearer ')
    ? header.slice(7)
    : (req.query.token ?? '');

  if (!raw) return res.status(401).json({ error: 'Authentication required' });

  try {
    const { data: { user }, error } = await getSupabase().auth.getUser(raw);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      authId:   user.id,
      email:    user.email ?? '',
      name:     user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      provider: user.app_metadata?.provider ?? 'email',
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
