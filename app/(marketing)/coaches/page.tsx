import type { Metadata } from "next";
import Image from "next/image";
import { CoachCard } from "@/components/sections/CoachCard";
import { client } from "@/lib/sanity/client";
import { coachesQuery } from "@/lib/sanity/queries";
import type { Coach } from "@/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Coaches",
  description:
    "Meet the Suhbah Soccer coaching staff — elite players turned mentors dedicated to developing the next generation.",
};

export default async function CoachesPage() {
  const coaches = await client.fetch<Coach[]>(coachesQuery);

  return (
    <>
      <section className="relative flex h-[36vh] min-h-[280px] w-full items-end overflow-hidden bg-ink">
        <Image
          src="/gallery/suhbah-team.png"
          alt="Suhbah Soccer team"
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-[0.15em] text-accent">
            Our Team
          </span>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl">
            Meet the Coaches
          </h1>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {coaches.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((coach, index) => (
                <CoachCard key={coach._id} coach={coach} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Coach profiles will appear here once added in Sanity Studio.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
