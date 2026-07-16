import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { StatBanner } from "@/components/sections/StatBanner";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Suhbah Soccer is part of Suhbah Institute, a Houston-based Islamic community organization, combining elite soccer training with Islamic character development.",
};

const approach = [
  {
    icon: "⚽",
    title: "Elite Training",
    description:
      "Technique, fitness, and tactical awareness led by qualified coaches with elite playing experience.",
  },
  {
    icon: "🕌",
    title: "Akhlaq & Mentorship",
    description:
      "Character-building woven into every session — discipline, sportsmanship, and Islamic mentorship.",
  },
  {
    icon: "🤝",
    title: "Brotherhood",
    description:
      "A fun, focused community where young athletes grow together as teammates and brothers in faith.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative flex h-[52vh] min-h-[360px] w-full items-end overflow-hidden bg-ink">
        <Image
          src="/gallery/suhbah-camp-kids.jpg"
          alt="Suhbah Soccer camp training session with kids"
          fill
          priority
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-[0.15em] text-accent">
            About Us
          </span>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl">
            Building Athletes &amp; Character
          </h1>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-lg text-muted-foreground">
              Suhbah Soccer is where football meets faith, ballers become
              brothers, and character is crafted. Our elite coaches provide
              high-level soccer training focused on ball mastery, speed,
              athleticism, and tactical awareness &mdash; alongside Islamic
              mentorship that helps young athletes grow in character as much
              as in skill.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Suhbah Soccer is part of Suhbah Institute, a Houston-based
              Islamic community organization. Our mission is to give young
              Muslim athletes a space where they can compete at a high level
              while staying rooted in their deen &mdash; building brotherhood,
              discipline, and akhlaq alongside footwork and fitness.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatBanner
            tone="ink"
            stats={[
              { value: "50+", label: "Players Trained" },
              { value: "3", label: "Expert Coaches" },
              { value: "100%", label: "Faith-Focused" },
            ]}
          />
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Our Approach"
            title="Football Meets Faith"
            description="Every session blends technical development with character-building in an environment rooted in Islamic values."
          />
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {approach.map((item, index) => (
              <Reveal
                key={item.title}
                delay={index * 0.1}
                className="rounded-xl border border-border p-6 text-center transition-shadow hover:shadow-lg"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-3xl">
                  {item.icon}
                </div>
                <h3 className="mt-4 font-display text-lg tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
