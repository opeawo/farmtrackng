// Server-only Supabase client using the service-role key so the outbreak tool
// can write past row-level security. NEVER import this into client code.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';

const url = pubEnv.PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

// Treat placeholder dev values as "not configured" so the app degrades
// gracefully instead of firing requests at a fake host.
export const supabaseConfigured =
	!!url &&
	!!serviceKey &&
	!url.includes('placeholder') &&
	!serviceKey.includes('placeholder');

export const supabaseAdmin: SupabaseClient | null = supabaseConfigured
	? createClient(url, serviceKey, { auth: { persistSession: false } })
	: null;
