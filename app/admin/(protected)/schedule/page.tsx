import Link from "next/link";
import { client } from "@/lib/sanity/client";
import { activeProgramsQuery } from "@/lib/sanity/queries";
import { createClient } from "@/lib/supabase/server-client";
import { GenerateScheduleDialog } from "@/components/admin/GenerateScheduleDialog";

interface ProgramSummary {
  _id: string;
  title: string;
  slug: string;
}

export default async function AdminSchedulePage() {
  const supabase = createClient();
  const [programs, { data: sessionRows }] = await Promise.all([
    client.fetch<ProgramSummary[]>(activeProgramsQuery),
    supabase
      .from("sessions")
      .select("program_slug, session_date, status")
      .not("program_slug", "is", null)
      .order("session_date", { ascending: true }),
  ]);

  const groups = new Map<
    string,
    { count: number; firstDate: string; lastDate: string; cancelledCount: number }
  >();
  for (const row of sessionRows ?? []) {
    if (!row.program_slug) continue;
    const existing = groups.get(row.program_slug);
    if (!existing) {
      groups.set(row.program_slug, {
        count: 1,
        firstDate: row.session_date,
        lastDate: row.session_date,
        cancelledCount: row.status === "cancelled" ? 1 : 0,
      });
    } else {
      existing.count += 1;
      existing.lastDate = row.session_date;
      if (row.status === "cancelled") existing.cancelledCount += 1;
    }
  }

  const titleBySlug = new Map(programs.map((p) => [p.slug, p.title]));
  const scheduledSlugs = new Set(groups.keys());
  const programsWithoutSchedule = programs.filter((p) => !scheduledSlugs.has(p.slug));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Schedule</h1>
          <p className="mt-2 text-muted-foreground">
            Session dates by program. Generate a schedule before opening registration.
          </p>
        </div>
        <GenerateScheduleDialog
          programs={programs.map((p) => ({ slug: p.slug, title: p.title }))}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Scheduled programs</h2>
        <ul className="mt-3 space-y-2">
          {Array.from(groups.entries()).map(([slug, summary]) => (
            <li key={slug}>
              <Link
                href={`/admin/schedule/${slug}`}
                className="flex items-center justify-between rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                <span className="font-medium text-foreground">
                  {titleBySlug.get(slug) ?? slug}
                </span>
                <span className="text-xs text-muted-foreground">
                  {summary.count} session{summary.count === 1 ? "" : "s"}
                  {summary.cancelledCount > 0 && ` (${summary.cancelledCount} cancelled)`}
                  {" · "}
                  {summary.firstDate} – {summary.lastDate}
                </span>
              </Link>
            </li>
          ))}
          {groups.size === 0 && (
            <li className="text-sm text-muted-foreground">No schedules yet.</li>
          )}
        </ul>
      </div>

      {programsWithoutSchedule.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">No schedule yet</h2>
          <ul className="mt-3 space-y-2">
            {programsWithoutSchedule.map((p) => (
              <li
                key={p.slug}
                className="rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground"
              >
                {p.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
