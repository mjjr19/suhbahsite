import type { Metadata } from "next";
import Image from "next/image";
import { ProgramCard } from "@/components/sections/ProgramCard";
import { client } from "@/lib/sanity/client";
import { activeProgramsQuery } from "@/lib/sanity/queries";
import type { Program } from "@/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Browse Suhbah Soccer camps, training packages, and individual sessions for youth athletes.",
};

export default async function ProgramsPage() {
  const programs = await client.fetch<Program[]>(activeProgramsQuery);

  return (
    <>
      <section className="relative flex h-[36vh] min-h-[280px] w-full items-end overflow-hidden bg-ink">
        <Image
          src="/programs/soccer-camps.jpg"
          alt="Suhbah Soccer training session"
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-[0.15em] text-accent">
            What We Offer
          </span>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl">
            Our Programs
          </h1>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {programs.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program, index) => (
                <ProgramCard key={program._id} program={program} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No programs are published yet. Add programs in Sanity Studio at{" "}
              <a href="/studio" className="underline">
                /studio
              </a>{" "}
              to have them appear here.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
