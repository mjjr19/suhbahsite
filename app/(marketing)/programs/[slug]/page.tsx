import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { PortableText } from "@portabletext/react";
import { client } from "@/lib/sanity/client";
import { urlFor } from "@/lib/sanity/image";
import {
  allProgramSlugsQuery,
  programBySlugQuery,
} from "@/lib/sanity/queries";
import { createClient } from "@/lib/supabase/server-client";
import type { Program, ProgramSession } from "@/types";
import { RegisterForm } from "@/components/sections/RegisterForm";
import { Reveal } from "@/components/motion/Reveal";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

const GOOGLE_FORM_SLUGS: Record<string, string> = {
  "fall-camp-2026":
    "https://docs.google.com/forms/d/1tVr2MecvgUT6kHSF4aJnzHe6tj0PTpuCQy3ZQmLKGuY/viewform",
};

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate) return "Dates TBD";
  const start = format(new Date(`${startDate}T00:00:00`), "MMMM d, yyyy");
  if (!endDate) return start;
  const end = format(new Date(`${endDate}T00:00:00`), "MMMM d, yyyy");
  return `${start} – ${end}`;
}

export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(allProgramSlugsQuery);
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const program = await client.fetch<Program | null>(programBySlugQuery, {
    slug: params.slug,
  });
  if (!program) return { title: "Program Not Found" };
  return {
    title: program.title,
    description: program.summary,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const program = await client.fetch<Program | null>(programBySlugQuery, {
    slug: params.slug,
  });

  if (!program) notFound();

  const supabase = createClient();
  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("id, session_date, start_time, end_time, label")
    .eq("program_slug", params.slug)
    .eq("status", "scheduled")
    .gte("session_date", new Date().toISOString().slice(0, 10))
    .order("session_date", { ascending: true });

  const sessions: ProgramSession[] = (sessionRows ?? []).map((row) => ({
    id: row.id,
    sessionDate: row.session_date,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    label: row.label,
  }));

  const imageUrl = program.heroImage
    ? urlFor(program.heroImage).width(1200).height(700).url()
    : null;

  const metaChips = [
    { icon: CalendarDays, label: formatDateRange(program.startDate, program.endDate) },
    program.location ? { icon: MapPin, label: program.location } : null,
    program.ageGroup ? { icon: Users, label: `Ages ${program.ageGroup}` } : null,
  ].filter(Boolean) as { icon: typeof CalendarDays; label: string }[];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={program.title}
              fill
              className="object-cover"
              priority
            />
          )}
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <Reveal delay={0.1} className="lg:col-span-2">
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              {program.title}
            </h1>
            {program.summary && (
              <p className="mt-4 text-lg text-muted-foreground">
                {program.summary}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {metaChips.map((chip) => (
                <div
                  key={chip.label}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
                >
                  <chip.icon className="h-4 w-4 text-primary" />
                  {chip.label}
                </div>
              ))}
            </div>

            {program.body && program.body.length > 0 && (
              <div className="prose prose-sm mt-8 max-w-none text-foreground prose-headings:font-display">
                <PortableText value={program.body} />
              </div>
            )}
          </Reveal>

          <Reveal delay={0.2} className="lg:col-span-1">
            <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
              <div className="p-6">
                <div className="font-display text-4xl tracking-tight text-primary">
                  {program.pricingTiers?.length ? "Starting at " : ""}
                  {formatPrice(program.price)}
                </div>
                {!program.active ? (
                  <p className="mt-4 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                    Registration for this program is currently closed.
                  </p>
                ) : GOOGLE_FORM_SLUGS[program.slug] ? (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Registration for this program is handled through our
                      registration form.
                    </p>
                    <Button asChild className="mt-4 w-full">
                      <a
                        href={GOOGLE_FORM_SLUGS[program.slug]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Register Now
                      </a>
                    </Button>
                  </div>
                ) : (
                  <RegisterForm program={program} sessions={sessions} />
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
