const { Pool } = require('pg');

const dbUrl      = process.env.DATABASE_URL ?? '';
const isSupabase = dbUrl.includes('supabase');
const useSSL     = isSupabase || process.env.NODE_ENV === 'production';

// Only disable prepared statements when using PgBouncer (port 6543).
// Direct connections (port 5432) work fine with prepared statements.
const isPgBouncer = dbUrl.includes(':6543');
function buildConnectionString(url) {
  if (!url || !isPgBouncer) return url;
  return url.includes('?')
    ? `${url}&prepared_statements=false`
    : `${url}?prepared_statements=false`;
}

const pool = new Pool({
  connectionString:        buildConnectionString(dbUrl),
  ssl:                     useSSL ? { rejectUnauthorized: false } : false,
  max:                     process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 2,
  idleTimeoutMillis:       10_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[db] unexpected pool error:', err.message);
});

module.exports = pool;
