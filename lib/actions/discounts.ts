"use server";

import { createClient } from "@/lib/supabase/server-client";
import { getCurrentStaff } from "@/lib/supabase/staff";

interface CreateDiscountCodeInput {
  code: string;
  kind: "blanket" | "financial_aid";
  percentOff: number;
  maxUses?: number;
  expiresAt?: string;
  notes?: string;
}

export async function createDiscountCode({
  code,
  kind,
  percentOff,
  maxUses,
  expiresAt,
  notes,
}: CreateDiscountCodeInput) {
  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) return { error: "Code is required." };
  if (kind !== "blanket" && kind !== "financial_aid") return { error: "Invalid kind." };
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    return { error: "Percent off must be between 1 and 100." };
  }

  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return { error: "Not authenticated." };
  if (currentStaff.role !== "admin") return { error: "Not authorized." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      code: trimmedCode,
      kind,
      percent_off: percentOff,
      max_uses: maxUses ?? null,
      expires_at: expiresAt || null,
      notes: notes?.trim() || null,
      created_by: currentStaff.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "That code already exists." };
    return { error: error.message };
  }
  return { success: true, code: data };
}

export async function deactivateDiscountCode({ id }: { id: string }) {
  if (!id) return { error: "Code is required." };

  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return { error: "Not authenticated." };
  if (currentStaff.role !== "admin") return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("discount_codes")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
