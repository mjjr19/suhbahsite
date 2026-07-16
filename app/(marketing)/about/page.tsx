import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { StatBanner } from "@/components/sections/StatBanner";

export const metadata: Metadata = {
  title: "About",
  description:
    "Suhbah Soccer is part of Suhbah Institute, a Houston-based Islamic community organization, combining elite soccer training with Islamic character development.",
};

export default function AboutPage() {
  return (
    <>
      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
            <Image
              src="/gallery/suhbah-camp-kids.jpg"
              alt="Suhbah Soccer camp training session with kids"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">
              About Us
            </span>
            <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
              Building Athletes &amp; Character
            </h1>
            <p className="mt-6 text-muted-foreground">
              Suhbah Soccer is where football meets faith, ballers become
              brothers, and character is crafted. Our elite coaches provide
              high-level soccer training focused on ball mastery, speed,
              athleticism, and tactical awareness &mdash; alongside Islamic
              mentorship that helps young athletes grow in character as much
              as in skill.
            </p>
            <p className="mt-4 text-muted-foreground">
              Suhbah Soccer is part of Suhbah Institute, a Houston-based
              Islamic community organization. Our mission is to give young
              Muslim athletes a space where they can compete at a high level
              while staying rooted in their deen &mdash; building brotherhood,
              discipline, and akhlaq alongside footwork and fitness.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatBanner
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
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-6 text-center">
              <div className="text-3xl">⚽</div>
              <h3 className="mt-4 font-display text-lg">Elite Training</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Technique, fitness, and tactical awareness led by qualified
                coaches with elite playing experience.
              </p>
            </div>
            <div className="rounded-xl border border-border p-6 text-center">
              <div className="text-3xl">🕌</div>
              <h3 className="mt-4 font-display text-lg">Akhlaq &amp; Mentorship</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Character-building woven into every session &mdash; discipline,
                sportsmanship, and Islamic mentorship.
              </p>
            </div>
            <div className="rounded-xl border border-border p-6 text-center">
              <div className="text-3xl">🤝</div>
              <h3 className="mt-4 font-display text-lg">Brotherhood</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A fun, focused community where young athletes grow together
                as teammates and brothers in faith.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
