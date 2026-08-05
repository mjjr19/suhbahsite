import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for use in API routes only (Stripe webhook, admin
 * staff invites, etc). Bypasses Row Level Security — never expose this
 * client or its key to the browser.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
