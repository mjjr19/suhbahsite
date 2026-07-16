"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBanner } from "@/components/sections/StatBanner";

interface HeroProps {
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  stats: { value: string; label: string }[];
  youtubeId: string;
}

export function Hero({
  badge,
  title,
  highlight,
  subtitle,
  primaryCta,
  secondaryCta,
  stats,
  youtubeId,
}: HeroProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/60 to-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span aria-hidden>⚽</span>
            {badge}
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            {title}
            <br />
            <span className="text-primary">{highlight}</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </div>
          <div className="mt-10">
            <StatBanner stats={stats} />
          </div>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border shadow-xl">
          {playing ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title="Suhbah Soccer Highlight"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group relative flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-[hsl(102,28%,32%)]"
              aria-label="Play highlight video"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-transform group-hover:scale-110">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </span>
              <span className="absolute bottom-5 rounded-full bg-black/40 px-4 py-1.5 text-sm font-medium text-white">
                Watch Highlights
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
