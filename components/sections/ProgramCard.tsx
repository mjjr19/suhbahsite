import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/Reveal";
import { urlFor } from "@/lib/sanity/image";
import { formatPrice } from "@/lib/utils";
import type { Program } from "@/types";

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate) return "Dates TBD";
  const start = format(new Date(startDate), "MMM d");
  if (!endDate) return start;
  const end = format(new Date(endDate), "MMM d, yyyy");
  return `${start} – ${end}`;
}

export function ProgramCard({
  program,
  index = 0,
}: {
  program: Program;
  index?: number;
}) {
  const imageUrl = program.heroImage
    ? urlFor(program.heroImage).width(600).height(400).url()
    : null;

  return (
    <Reveal delay={Math.min(index, 5) * 0.08}>
      <Link
        href={`/programs/${program.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
      >
        <span className="absolute -left-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-sm text-accent-foreground shadow-md">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={program.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-5xl">
              ⚽
            </div>
          )}
          {program.ageGroup && (
            <Badge className="absolute right-3 top-3 bg-background/90 text-foreground hover:bg-background/90">
              Ages {program.ageGroup}
            </Badge>
          )}
          {!program.active && (
            <Badge
              variant="secondary"
              className="absolute bottom-3 left-3 bg-foreground/85 text-background hover:bg-foreground/85"
            >
              Closed
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-xl tracking-tight text-foreground">
            {program.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateRange(program.startDate, program.endDate)}
          </p>
          {program.summary && (
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {program.summary}
            </p>
          )}
          {program.location && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {program.location}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-display text-2xl text-primary">
              {program.pricingTiers?.length ? "Starting at " : ""}
              {formatPrice(program.price)}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              View Details
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
