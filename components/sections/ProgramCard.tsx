import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { urlFor } from "@/lib/sanity/image";
import type { Program } from "@/types";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate) return "Dates TBD";
  const start = format(new Date(startDate), "MMM d");
  if (!endDate) return start;
  const end = format(new Date(endDate), "MMM d, yyyy");
  return `${start} – ${end}`;
}

export function ProgramCard({ program }: { program: Program }) {
  const imageUrl = program.heroImage
    ? urlFor(program.heroImage).width(600).height(400).url()
    : null;

  return (
    <Link
      href={`/programs/${program.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={program.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
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
            className="absolute left-3 top-3 bg-foreground/80 text-background hover:bg-foreground/80"
          >
            Closed
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl text-foreground">{program.title}</h3>
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
            {formatPrice(program.price)}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            View Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
