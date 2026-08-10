"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getCurrentStaff } from "@/lib/supabase/staff";

interface InviteStaffInput {
  fullName: string;
  email: string;
  role: "admin" | "coach";
}

export async function inviteStaff({ fullName, email, role }: InviteStaffInput) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = fullName.trim();

  if (!trimmedName || !normalizedEmail) {
    return { error: "Name and email are required." };
  }
  if (role !== "admin" && role !== "coach") {
    return { error: "Invalid role." };
  }

  const currentStaff = await getCurrentStaff();
  if (!currentStaff) {
    return { error: "Not authenticated." };
  }
  if (currentStaff.role !== "admin") {
    return { error: "Not authorized." };
  }

  const adminClient = createAdminClient();

  const { data: newStaff, error: insertError } = await adminClient
    .from("staff")
    .insert({
      full_name: trimmedName,
      email: normalizedEmail,
      role,
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
