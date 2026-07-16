import Link from "next/link";
import { ArrowRight, HandHeart, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/sections/Hero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { ProgramCard } from "@/components/sections/ProgramCard";
import { CoachCard } from "@/components/sections/CoachCard";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { Reveal } from "@/components/motion/Reveal";
import { client } from "@/lib/sanity/client";
import {
  activeProgramsQuery,
  coachesQuery,
  testimonialsQuery,
} from "@/lib/sanity/queries";
import type { Coach, Program, Testimonial } from "@/types";

export const revalidate = 60;

const features = [
  {
    icon: ShieldCheck,
    title: "Elite Training",
    description: "Ball mastery, speed, and tactical awareness",
  },
  {
    icon: HandHeart,
    title: "Islamic Mentorship",
    description: "Spiritual talks and character-building",
  },
  {
    icon: Users,
    title: "Brotherhood",
    description: "Fun, focused community environment",
  },
];

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
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.1} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="mt-5 font-display text-xl tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Reveal>
            ))}
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
            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.slice(0, 3).map((coach, index) => (
                <CoachCard key={coach._id} coach={coach} index={index} />
              ))}
            </div>
          ) : (
            <p className="mt-14 text-center text-muted-foreground">
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
            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {programs.slice(0, 3).map((program, index) => (
                <ProgramCard key={program._id} program={program} index={index} />
              ))}
            </div>
          ) : (
            <p className="mt-14 text-center text-muted-foreground">
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
        <section className="bg-ink py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader label="Testimonials" title="What Families Say" tone="ink" />
            <div className="mt-14">
              <TestimonialCarousel testimonials={testimonials} tone="ink" />
            </div>
          </div>
        </section>
      )}

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[hsl(102,28%,30%)] px-8 py-16 text-center sm:px-16">
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl">
              Ready to Register?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Join young athletes who have elevated their game with Suhbah
              Soccer.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-white text-primary hover:bg-white/90"
            >
              <Link href="/programs">
                Complete Registration <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
