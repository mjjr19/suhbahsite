"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Testimonial } from "@/types";

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  tone?: "light" | "ink";
}

export function TestimonialCarousel({
  testimonials,
  tone = "light",
}: TestimonialCarouselProps) {
  const [index, setIndex] = useState(0);
  const isInk = tone === "ink";

  if (testimonials.length === 0) return null;

  const current = testimonials[index];
  const next = () => setIndex((i) => (i + 1) % testimonials.length);
  const prev = () =>
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <Quote className="mx-auto h-10 w-10 text-accent" />
      <AnimatePresence mode="wait">
        <motion.div
          key={current._id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <p
            className={`mt-5 font-display text-2xl leading-snug tracking-tight sm:text-3xl ${
              isInk ? "text-ink-foreground" : "text-foreground"
            }`}
          >
            &ldquo;{current.quote}&rdquo;
          </p>
          {current.rating && (
            <div className="mt-5 flex justify-center gap-1 text-accent">
              {Array.from({ length: current.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
          )}
          <div className="mt-4">
            <p
              className={`font-semibold ${
                isInk ? "text-ink-foreground" : "text-foreground"
              }`}
            >
              {current.authorName}
            </p>
            {current.authorRelation && (
              <p
                className={
                  isInk ? "text-sm text-ink-muted-foreground" : "text-sm text-muted-foreground"
                }
              >
                {current.authorRelation}
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {testimonials.length > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            aria-label="Previous testimonial"
            className={
              isInk
                ? "border-ink-border bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
                : ""
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1.5">
            {testimonials.map((t, i) => (
              <button
                key={t._id}
                onClick={() => setIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === index
                    ? "bg-accent"
                    : isInk
                      ? "bg-ink-border"
                      : "bg-border"
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            aria-label="Next testimonial"
            className={
              isInk
                ? "border-ink-border bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
                : ""
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
