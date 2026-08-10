"use server";

import { createClient } from "@/lib/supabase/server-client";
import { getCurrentStaff } from "@/lib/supabase/staff";

const STATUSES = ["present", "absent", "excused", "unmarked"] as const;
type AttendanceStatus = (typeof STATUSES)[number];

interface MarkAttendanceInput {
  sessionRegistrationId: string;
  status: AttendanceStatus;
}

export async function markAttendance({ sessionRegistrationId, status }: MarkAttendanceInput) {
  if (!sessionRegistrationId) return { error: "Missing roster entry." };
  if (!STATUSES.includes(status)) return { error: "Invalid attendance status." };

  // Both admin and coach can mark attendance — active staff is enough.
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return { error: "Not authenticated." };

  const supabase = createClient();
  const { error } = await supabase
    .from("session_registrations")
    .update({
      attendance_status: status,
      marked_by: currentStaff.id,
      marked_at: new Date().toISOString(),
    })
    .eq("id", sessionRegistrationId);

  if (error) return { error: error.message };
  return { success: true };
}
