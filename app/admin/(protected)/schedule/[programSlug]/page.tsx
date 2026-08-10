import Link from "next/link";
import { format } from "date-fns";
import { client } from "@/lib/sanity/client";
import { programBySlugQuery } from "@/lib/sanity/queries";
import { createClient } from "@/lib/supabase/server-client";
import { Badge } from "@/components/ui/badge";
import { CancelSessionButton } from "@/components/admin/CancelSessionButton";
import type { Program } from "@/types";

export default async function AdminProgramSchedulePage({
  params,
}: {
  params: { programSlug: string };
}) {
  const supabase = createClient();
  const [program, { data: sessions }] = await Promise.all([
    client.fetch<Program | null>(programBySlugQuery, { slug: params.programSlug }),
    supabase
      .from("sessions")
      .select("id, session_date, start_time, end_time, label, status")
      .eq("program_slug", params.programSlug)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: rosterRows } = sessionIds.length
    ? await supabase.from("session_registrations").select("session_id").in("session_id", sessionIds)
    : { data: [] as { session_id: string }[] };

  const rosterCounts = new Map<string, number>();
  for (const row of rosterRows ?? []) {
    rosterCounts.set(row.session_id, (rosterCounts.get(row.session_id) ?? 0) + 1);
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/schedule" className="text-sm text-muted-foreground hover:underline">
        ← All schedules
      </Link>
      <h1 className="mt-2 font-display text-3xl text-foreground">
        {program?.title ?? params.programSlug}
      </h1>

      <ul className="mt-8 space-y-2">
        {(sessions ?? []).map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-md border border-border px-4 py-2 text-sm"
          >
            <Link
              href={`/admin/schedule/${params.programSlug}/sessions/${s.id}`}
              className="flex-1 hover:underline"
            >
              <span className="font-medium text-foreground">
                {format(new Date(`${s.session_date}T00:00:00`), "EEE, MMM d, yyyy")}
              </span>
              {s.start_time && (
                <span className="text-muted-foreground"> · {s.start_time.slice(0, 5)}</span>
              )}
              <span className="ml-2 text-muted-foreground">
                {rosterCounts.get(s.id) ?? 0} on roster
              </span>
            </Link>
            <div className="flex items-center gap-3">
              {s.status === "cancelled" ? (
                <Badge variant="outline">cancelled</Badge>
              ) : (
                <CancelSessionButton sessionId={s.id} />
              )}
            </div>
          </li>
        ))}
        {(sessions ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">No sessions generated yet.</li>
        )}
      </ul>
    </div>
  );
}
