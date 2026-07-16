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

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={program.title}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="font-display text-3xl text-foreground sm:text-4xl">
              {program.title}
            </h1>
            {program.summary && (
              <p className="mt-4 text-lg text-muted-foreground">
                {program.summary}
              </p>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDateRange(program.startDate, program.endDate)}
              </div>
              {program.location && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {program.location}
                </div>
              )}
              {program.ageGroup && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Ages {program.ageGroup}
                </div>
              )}
            </div>

            {program.body && program.body.length > 0 && (
              <div className="prose prose-sm mt-8 max-w-none text-foreground prose-headings:font-display">
                <PortableText value={program.body} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <div className="font-display text-3xl text-primary">
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
        </div>
      </div>
    </section>
  );
}
