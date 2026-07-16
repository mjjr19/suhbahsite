import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
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
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="What We Offer"
          title="Our Programs"
          description="Find the perfect program for your young athlete's development."
        />
        {programs.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard key={program._id} program={program} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-muted-foreground">
            No programs are published yet. Add programs in Sanity Studio at{" "}
            <a href="/studio" className="underline">
              /studio
            </a>{" "}
            to have them appear here.
          </p>
        )}
      </div>
    </section>
  );
}
