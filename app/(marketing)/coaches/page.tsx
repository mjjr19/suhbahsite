import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
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
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Our Team"
          title="Meet the Coaches"
          description="Elite players turned mentors, dedicated to developing the next generation."
        />
        {coaches.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <CoachCard key={coach._id} coach={coach} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-muted-foreground">
            Coach profiles will appear here once added in Sanity Studio.
          </p>
        )}
      </div>
    </section>
  );
}
