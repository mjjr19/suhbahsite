import Link from "next/link";
import { ArrowRight, HandHeart, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/sections/Hero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { ProgramCard } from "@/components/sections/ProgramCard";
import { CoachCard } from "@/components/sections/CoachCard";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { client } from "@/lib/sanity/client";
import {
  activeProgramsQuery,
  coachesQuery,
  testimonialsQuery,
} from "@/lib/sanity/queries";
import type { Coach, Program, Testimonial } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const [programs, coaches, testimonials] = await Promise.all([
    client.fetch<Program[]>(activeProgramsQuery),
    client.fetch<Coach[]>(coachesQuery),
    client.fetch<Testimonial[]>(testimonialsQuery),
  ]);

  return (
    <>
      <Hero
        badge="EST. 2025 • Redmond, WA"
        title="Where Football"
        highlight="Meets Faith"
        subtitle="Elite soccer training combined with Islamic character development. Building champions on and off the pitch."
        primaryCta={{ label: "Register Now", href: "/programs" }}
        secondaryCta={{ label: "View Programs", href: "/programs" }}
        stats={[
          { value: "50+", label: "Players Trained" },
          { value: "3", label: "Expert Coaches" },
          { value: "100%", label: "Faith-Focused" },
        ]}
        youtubeId="WFHixrKzyGU"
      />

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="What We Offer"
            title="Building Athletes & Character"
            description="Suhbah Soccer is where football meets faith, ballers become brothers, and character is crafted. Our elite coaches provide high-level soccer training focused on ball mastery, speed, athleticism, and tactical awareness."
          />
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-lg">Elite Training</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ball mastery, speed, and tactical awareness
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HandHeart className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-lg">Islamic Mentorship</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Spiritual talks and character-building
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-lg">Brotherhood</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Fun, focused community environment
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Our Team"
            title="Meet the Coaches"
            description="Elite players turned mentors, dedicated to developing the next generation."
          />
          {coaches.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.slice(0, 3).map((coach) => (
                <CoachCard key={coach._id} coach={coach} />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-muted-foreground">
              Coach profiles will appear here once added in Sanity Studio.
            </p>
          )}
          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link href="/coaches">
                Meet the Full Team <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="What We Offer"
            title="Our Programs"
            description="Find the perfect program for your young athlete's development."
          />
          {programs.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {programs.slice(0, 3).map((program) => (
                <ProgramCard key={program._id} program={program} />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-muted-foreground">
              Programs will appear here once added in Sanity Studio.
            </p>
          )}
          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link href="/programs">
                View All Programs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader label="Testimonials" title="What Families Say" />
            <div className="mt-12">
              <TestimonialCarousel testimonials={testimonials} />
            </div>
          </div>
        </section>
      )}

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">
            Ready to Register?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join young athletes who have elevated their game with Suhbah
            Soccer.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/programs">
              Complete Registration <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
