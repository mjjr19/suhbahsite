"use client";

import Image from "next/image";
import { useState } from "react";
import { Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Reveal } from "@/components/motion/Reveal";
import { urlFor } from "@/lib/sanity/image";
import type { GalleryItem } from "@/types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => {
          const thumbUrl = urlFor(item.image).width(500).height(500).url();
          return (
            <Reveal key={item._id} delay={Math.min(index, 7) * 0.05}>
              <button
                type="button"
                onClick={() => setActive(item)}
                className="group relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted"
              >
                <Image
                  src={thumbUrl}
                  alt={item.caption || "Suhbah Soccer gallery photo"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/70 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Expand className="h-4 w-4 text-white" />
                  {item.caption && (
                    <span className="ml-auto max-w-[80%] truncate text-right text-xs font-medium text-white">
                      {item.caption}
                    </span>
                  )}
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle className="sr-only">
            {active?.caption || "Gallery photo"}
          </DialogTitle>
          {active && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={urlFor(active.image).width(1400).height(900).url()}
                alt={active.caption || "Suhbah Soccer gallery photo"}
                fill
                className="object-contain"
              />
            </div>
          )}
          {active?.caption && (
            <p className="text-center text-sm text-muted-foreground">
              {active.caption}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
