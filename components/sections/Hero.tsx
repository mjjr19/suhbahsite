"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

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
    <section className="relative overflow-hidden bg-ink pb-28 pt-16 sm:pt-20 lg:pb-40 lg:pt-24 [clip-path:polygon(0_0,100%_0,100%_100%,0_calc(100%-4vw))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-hidden opacity-[0.06]"
      >
        <span className="absolute -right-16 -top-24 font-display text-[32rem] leading-none text-white">
          ⚽
        </span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-primary/25 via-transparent to-transparent"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"
      >
        <div>
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-ink-border bg-white/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-accent"
          >
            <span aria-hidden>⚽</span>
            {badge}
          </motion.span>
          <motion.h1
            variants={item}
            className="mt-6 font-display text-5xl leading-[0.98] tracking-tight text-ink-foreground sm:text-6xl lg:text-7xl"
          >
            {title}
            <br />
            <span className="text-primary">{highlight}</span>
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-6 max-w-lg text-lg text-ink-muted-foreground"
          >
            {subtitle}
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="group">
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-ink-border bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
            >
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </motion.div>
          <motion.div variants={item} className="mt-12">
            <StatBanner stats={stats} tone="ink" />
          </motion.div>
        </div>

        <motion.div variants={item} className="relative">
          <div
            aria-hidden
            className="absolute -inset-3 rotate-2 rounded-2xl bg-accent/90 sm:-inset-4"
          />
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ink-border shadow-2xl">
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
                className="group relative flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-[hsl(102,28%,28%)]"
                aria-label="Play highlight video"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary shadow-lg transition-transform group-hover:scale-110">
                  <Play className="ml-1 h-8 w-8 fill-current" />
                </span>
                <span className="absolute bottom-6 rounded-full bg-black/50 px-4 py-1.5 text-sm font-semibold text-white">
                  Watch Highlights
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
