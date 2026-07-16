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
import { urlFor } from "@/lib/sanity/image";
import type { Coach } from "@/types";

export function CoachCard({ coach }: { coach: Coach }) {
  const [open, setOpen] = useState(false);
  const photoUrl = coach.photo
    ? urlFor(coach.photo).width(500).height(500).url()
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-lg"
        >
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={coach.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl">
                ⚽
              </div>
            )}
          </div>
          <div className="p-5">
            <h3 className="font-display text-xl text-foreground">{coach.name}</h3>
            {coach.role && (
              <p className="mt-1 text-sm font-medium text-primary">{coach.role}</p>
            )}
            {coach.bio && (
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {coach.bio}
              </p>
            )}
            <span className="mt-4 inline-block text-sm font-medium text-primary">
              View Full Profile →
            </span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {photoUrl && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
                <Image src={photoUrl} alt={coach.name} fill className="object-cover" />
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
  );
}
