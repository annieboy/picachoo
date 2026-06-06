const { Pool } = require('pg');

const dbUrl      = process.env.DATABASE_URL ?? '';
const isSupabase = dbUrl.includes('supabase');
const useSSL     = isSupabase || process.env.NODE_ENV === 'production';

// PgBouncer transaction mode doesn't support prepared statements.
// Append the flag as a plain string — avoids URL parsing issues with
// postgres:// schemes that some environments pass in non-standard formats.
function withNoPreparedStatements(url) {
  if (!url) return url;
  return url.includes('?')
    ? `${url}&prepared_statements=false`
    : `${url}?prepared_statements=false`;
}

const pool = new Pool({
  connectionString:        withNoPreparedStatements(dbUrl),
  ssl:                     useSSL ? { rejectUnauthorized: false } : false,
  max:                     process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 2,
  idleTimeoutMillis:       10_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[db] unexpected pool error:', err.message);
});

module.exports = pool;
