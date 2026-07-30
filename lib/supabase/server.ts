import { createClient } from "@supabase/supabase-js";

/**
 * Read-only catalog client. Uses the publishable key, so RLS applies: it can select the
 * catalog and nothing else. Safe to use from any server component.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

/**
 * Bypasses RLS. Only for route handlers that write feedback or moderate suggestions.
 * Throws at call time rather than import time so a missing key breaks one request
 * instead of the whole build.
 */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}
