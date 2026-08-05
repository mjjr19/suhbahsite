"use server";

import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";

interface InviteStaffInput {
  fullName: string;
  email: string;
}

export async function inviteStaff({ fullName, email }: InviteStaffInput) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = fullName.trim();

  if (!trimmedName || !normalizedEmail) {
    return { error: "Name and email are required." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { data: currentStaff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!currentStaff) {
    return { error: "Not authorized." };
  }

  const adminClient = createAdminClient();

  const { data: newStaff, error: insertError } = await adminClient
    .from("staff")
    .insert({
      full_name: trimmedName,
      email: normalizedEmail,
      invited_by: currentStaff.id,
    })
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  const redirectBase = process.env.ADMIN_INVITE_REDIRECT_URL || "";

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    normalizedEmail,
    { redirectTo: `${redirectBase}/auth/callback?next=/admin` },
  );

  if (inviteError) {
    return { error: inviteError.message };
  }

  return { success: true, staffId: newStaff.id as string };
}
