import { createClient } from '@supabase/supabase-js';

// These are safe to expose in the browser — the anon key only allows
// operations permitted by Supabase Row Level Security policies.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('Supabase env vars not set — Realtime will not work.');
}

export const supabase = createClient(url ?? '', key ?? '');
