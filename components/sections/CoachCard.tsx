"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Reveal } from "@/components/motion/Reveal";
import { urlFor } from "@/lib/sanity/image";
import type { Coach } from "@/types";

export function CoachCard({
  coach,
  index = 0,
}: {
  coach: Coach;
  index?: number;
}) {
  const [open, setOpen] = useState(false);
  const photoUrl = coach.photo
    ? urlFor(coach.photo).width(500).height(500).url()
    : null;

  return (
    <Reveal delay={Math.min(index, 5) * 0.08} className="h-full">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
          >
            <span className="absolute -left-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-sm text-accent-foreground shadow-md">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={coach.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-5xl">
                  ⚽
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="p-5">
              <h3 className="font-display text-xl tracking-tight text-foreground">
                {coach.name}
              </h3>
              {coach.role && (
                <p className="mt-1 text-sm font-semibold text-primary">
                  {coach.role}
                </p>
              )}
              {coach.bio && (
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {coach.bio}
                </p>
              )}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                View Full Profile
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              {photoUrl && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={photoUrl}
                    alt={coach.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <DialogTitle className="font-display text-2xl">
                  {coach.name}
                </DialogTitle>
                {coach.role && (
                  <p className="text-sm font-medium text-primary">{coach.role}</p>
                )}
              </div>
            </div>
          </DialogHeader>
          {coach.bio && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {coach.bio}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </Reveal>
  );
}
