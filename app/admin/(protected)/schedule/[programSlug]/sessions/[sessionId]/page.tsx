import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server-client";
import { AttendanceControl } from "@/components/admin/AttendanceControl";

interface RosterRow {
  session_registration_id: string;
  registration_id: string;
  child_name: string;
  child_age: string | null;
  allergies: string | null;
  medications: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  attendance_status: string;
  marked_by: string | null;
  marked_at: string | null;
}

export default async function AdminSessionRosterPage({
  params,
}: {
  params: { programSlug: string; sessionId: string };
}) {
  const supabase = createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, session_date, start_time, label")
    .eq("id", params.sessionId)
    .maybeSingle();

  if (!session) notFound();

  const { data: roster, error } = await supabase.rpc("session_roster", {
    p_session_id: params.sessionId,
  });

  const rows = (roster ?? []) as RosterRow[];

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/schedule/${params.programSlug}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to schedule
      </Link>
      <h1 className="mt-2 font-display text-3xl text-foreground">
        {format(new Date(`${session.session_date}T00:00:00`), "EEEE, MMMM d, yyyy")}
      </h1>
      {session.start_time && (
        <p className="text-muted-foreground">{session.start_time.slice(0, 5)}</p>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error.message}</p>}

      <ul className="mt-8 space-y-2">
        {rows.map((r) => (
          <li
            key={r.session_registration_id}
            className="rounded-md border border-border px-4 py-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-foreground">{r.child_name}</span>
                {r.child_age && (
                  <span className="text-muted-foreground"> · Age {r.child_age}</span>
                )}
              </div>
              <AttendanceControl
                sessionRegistrationId={r.session_registration_id}
                currentStatus={r.attendance_status}
              />
            </div>
            <div className="mt-1 text-muted-foreground">
              {r.parent_name || "—"}
              {r.parent_phone ? ` · ${r.parent_phone}` : ""}
            </div>
            {(r.allergies || r.medications) && (
              <div className="mt-1 text-destructive">
                {r.allergies && <span>Allergies: {r.allergies} </span>}
                {r.medications && <span>Medications: {r.medications}</span>}
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-sm text-muted-foreground">No one is assigned to this session.</li>
        )}
      </ul>
    </div>
  );
}
