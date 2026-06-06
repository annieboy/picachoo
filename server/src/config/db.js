const { Pool } = require('pg');

const dbUrl  = process.env.DATABASE_URL ?? '';
const isSupabase = dbUrl.includes('supabase');
const useSSL = isSupabase || process.env.NODE_ENV === 'production';

// PgBouncer transaction mode (port 6543) does not support server-side prepared
// statements. Appending ?prepared_statements=false (or pgbouncer=true for older
// drivers) disables them so every query uses the simple protocol instead.
function buildConnectionString(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('prepared_statements', 'false');
    return u.toString();
  } catch {
    // URL parse failed — return as-is and hope for the best
    return url;
  }
}

const pool = new Pool({
  connectionString: buildConnectionString(dbUrl),
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max:                    process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 2,
  idleTimeoutMillis:      10_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[db] unexpected pool error:', err.message);
});

module.exports = pool;
