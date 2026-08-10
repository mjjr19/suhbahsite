import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SuhbahFamily eligibility: any prior *paid* registration under this email.
 * Shared by /api/family-check (live UI indicator) and the checkout route
 * (authoritative re-check) so the two can't disagree.
 */
export async function checkFamilyEligibility(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("registrations")
    .select("id")
    .ilike("parent_email", email.trim())
    .eq("payment_status", "paid")
    .limit(1)
    .maybeSingle();

  return !!data;
}
