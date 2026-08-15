import { createClient } from "@supabase/supabase-js";

export type ChannelClient = ReturnType<typeof createClient>;

let supabaseClient: ChannelClient | undefined;

export function getSupabaseChannelClient(): ChannelClient {
  if (supabaseClient) return supabaseClient;

  // This module is used by server-side payment handlers. Prefer the existing
  // server credentials so a client never needs permission to publish payment
  // events. The publishable key remains a local-development fallback.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) throw new Error("Supabase Realtime configuration is missing.");

  supabaseClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabaseClient;
}
