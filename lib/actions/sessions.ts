"use server";

import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server-client";
import { getCurrentStaff } from "@/lib/supabase/staff";

interface GenerateSessionsInput {
  programSlug: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  startTime?: string;
  endTime?: string;
  labelPrefix?: string;
}

export async function generateSessions({
  programSlug,
  startDate,
  endDate,
  weekdays,
  startTime,
  endTime,
  labelPrefix,
}: GenerateSessionsInput) {
  if (!programSlug) return { error: "Program is required." };
  if (!startDate || !endDate) return { error: "Start and end dates are required." };
  if (startDate > endDate) return { error: "Start date must be before end date." };
  if (!weekdays || weekdays.length === 0) return { error: "Select at least one weekday." };

  // Both admin and coach can manage the schedule — active staff is enough.
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return { error: "Not authenticated." };

  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (dates.length === 0) {
    return { error: "No dates in that range match the selected weekdays." };
  }

  const supabase = createClient();
  const { data: inserted, error } = await supabase
    .from("sessions")
    .insert(
      dates.map((sessionDate, i) => {
        const formatted = format(new Date(`${sessionDate}T00:00:00`), "EEE, MMM d");
        return {
          program_slug: programSlug,
          label: labelPrefix ? `${labelPrefix} — ${formatted}` : formatted,
          session_date: sessionDate,
          start_time: startTime || null,
          end_time: endTime || null,
          sort_order: i,
        };
      }),
    )
    .select();

  if (error) return { error: error.message };
  return { success: true, count: inserted?.length ?? 0 };
}

interface UpdateSessionInput {
  sessionId: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  label?: string;
}

export async function updateSession({
  sessionId,
  sessionDate,
  startTime,
  endTime,
  label,
}: UpdateSessionInput) {
  if (!sessionId) return { error: "Session is required." };

  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return { error: "Not authenticated." };

  const updates: Record<string, unknown> = {};
  if (sessionDate) updates.session_date = sessionDate;
  if (startTime !== undefined) updates.start_time = startTime || null;
  if (endTime !== undefined) updates.end_time = endTime || null;
  if (label) updates.label = label;

  if (Object.keys(updates).length === 0) {
    return { error: "Nothing to update." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("sessions").update(updates).eq("id", sessionId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function cancelSession({ sessionId }: { sessionId: string }) {
  if (!sessionId) return { error: "Session is required." };

  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return { error: "Not authenticated." };

  const supabase = createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId);

  if (error) return { error: error.message };
  return { success: true };
}
