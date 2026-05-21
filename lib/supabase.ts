import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase env vars not configured');
    _supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabase;
}

export { _supabase as supabase };
