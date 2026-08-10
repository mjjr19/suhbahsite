import { createClient } from "@/lib/supabase/server-client";

export type StaffRole = "admin" | "coach";

export interface CurrentStaff {
  id: string;
  fullName: string;
  role: StaffRole;
}

/**
 * Resolves the signed-in user's active staff row (id, name, role), or null
 * if not signed in or not active staff. Shared by the protected layout's
 * auth gate, per-page role guards, and server actions that need to know
 * whether the caller is a coach or an admin.
 */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!staff) return null;

  return { id: staff.id, fullName: staff.full_name, role: staff.role as StaffRole };
}
