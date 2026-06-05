const { Pool } = require('pg');

// Supabase (and most hosted Postgres providers) require SSL.
// We enable it whenever DATABASE_URL contains "supabase" or NODE_ENV is production.
const isSupabase = (process.env.DATABASE_URL ?? '').includes('supabase');
const useSSL = isSupabase || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
