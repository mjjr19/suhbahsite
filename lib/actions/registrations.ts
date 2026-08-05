"use server";

import { createClient } from "@/lib/supabase/server-client";

interface RecordPaymentInput {
  registrationId: string;
  amountCents: number;
  method: "zelle" | "cash" | "stripe" | "other";
  paidAt: string;
  notes?: string;
  receiptUrl?: string;
}

export async function recordPayment({
  registrationId,
  amountCents,
  method,
  paidAt,
  notes,
  receiptUrl,
}: RecordPaymentInput) {
  if (!registrationId || !amountCents || amountCents <= 0) {
    return { error: "A positive amount is required." };
  }
  if (!["zelle", "cash", "stripe", "other"].includes(method)) {
    return { error: "Invalid payment method." };
  }
  if (!paidAt) {
    return { error: "Payment date is required." };
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

  const { data: payment, error: insertError } = await supabase
    .from("payments")
    .insert({
      registration_id: registrationId,
      amount_cents: amountCents,
      method,
      paid_at: paidAt,
      notes: notes || null,
      receipt_url: receiptUrl || null,
      recorded_by: currentStaff.id,
    })
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  const { data: allPayments, error: sumError } = await supabase
    .from("payments")
    .select("amount_cents")
    .eq("registration_id", registrationId);

  if (sumError) {
    return { error: sumError.message };
  }

  const total = (allPayments ?? []).reduce((sum, p) => sum + p.amount_cents, 0);

  const { error: updateError } = await supabase
    .from("registrations")
    .update({ amount_paid_cents: total })
    .eq("id", registrationId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true, paymentId: payment.id as string, newTotalCents: total };
}

interface UpdatePaymentStatusInput {
  registrationId: string;
  status: "unpaid" | "partial" | "paid";
}

export async function updatePaymentStatus({
  registrationId,
  status,
}: UpdatePaymentStatusInput) {
  if (!["unpaid", "partial", "paid"].includes(status)) {
    return { error: "Invalid status." };
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

  const { error: updateError } = await supabase
    .from("registrations")
    .update({ payment_status: status })
    .eq("id", registrationId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
