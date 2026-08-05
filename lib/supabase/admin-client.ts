import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Service-role client for admin-portal server actions (staff invites, etc).
 * Alias over the shared service-role client — server-only, bypasses RLS.
 */
export const createAdminClient = createServiceRoleClient;
