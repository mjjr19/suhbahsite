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
import type { Program } from "@/types";
import { RegisterForm } from "@/components/sections/RegisterForm";
import { Reveal } from "@/components/motion/Reveal";

export const revalidate = 60;

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate) return "Dates TBD";
  const start = format(new Date(startDate), "MMMM d, yyyy");
  if (!endDate) return start;
  const end = format(new Date(endDate), "MMMM d, yyyy");
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
                  {formatPrice(program.price)}
                </div>
                {!program.active ? (
                  <p className="mt-4 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                    Registration for this program is currently closed.
                  </p>
                ) : (
                  <RegisterForm program={program} />
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
