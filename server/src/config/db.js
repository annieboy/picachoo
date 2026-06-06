const { Pool } = require('pg');

// Supabase (and most hosted Postgres providers) require SSL.
// We enable it whenever DATABASE_URL contains "supabase" or NODE_ENV is production.
const isSupabase = (process.env.DATABASE_URL ?? '').includes('supabase');
const useSSL = isSupabase || process.env.NODE_ENV === 'production';

// Vercel serverless: each function instance is short-lived, so keep the pool
// small. PgBouncer (transaction mode) sits in front of Postgres — it multiplexes
// thousands of app connections onto a small set of real DB connections, so we
// only need 1–2 connections per function instance.
// Set DATABASE_URL to your Supabase PgBouncer URL (port 6543) in production.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max:              process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 2,
  idleTimeoutMillis: 10_000,   // release idle connections quickly — functions are short-lived
  connectionTimeoutMillis: 5_000,  // fail fast rather than queue indefinitely
});

pool.on('error', (err) => {
  console.error('[db] unexpected pool error:', err.message);
});

module.exports = pool;
