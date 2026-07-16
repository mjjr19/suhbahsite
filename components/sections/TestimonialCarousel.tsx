"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Testimonial } from "@/types";

export function TestimonialCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [index, setIndex] = useState(0);

  if (testimonials.length === 0) return null;

  const current = testimonials[index];
  const next = () => setIndex((i) => (i + 1) % testimonials.length);
  const prev = () =>
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <Quote className="mx-auto h-8 w-8 text-primary/40" />
      <p className="mt-4 text-lg leading-relaxed text-foreground sm:text-xl">
        &ldquo;{current.quote}&rdquo;
      </p>
      {current.rating && (
        <div className="mt-4 flex justify-center gap-1 text-primary">
          {Array.from({ length: current.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </div>
      )}
      <div className="mt-4">
        <p className="font-semibold text-foreground">{current.authorName}</p>
        {current.authorRelation && (
          <p className="text-sm text-muted-foreground">{current.authorRelation}</p>
        )}
      </div>

      {testimonials.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            aria-label="Previous testimonial"
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
                  i === index ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
