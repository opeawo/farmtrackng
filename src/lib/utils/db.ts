import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Read at runtime (not build time) so deployments without these vars — e.g.
// preview builds — still compile. `supabase` is null when unconfigured;
// callers must guard for it.
const url = env.PUBLIC_SUPABASE_URL;
const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
	url && anonKey ? createClient(url, anonKey) : null;
