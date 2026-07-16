import { AnimatedCounter } from "@/components/motion/AnimatedCounter";

interface Stat {
  value: string;
  label: string;
}

interface StatBannerProps {
  stats: Stat[];
  tone?: "light" | "ink";
}

export function StatBanner({ stats, tone = "light" }: StatBannerProps) {
  const isInk = tone === "ink";

  return (
    <div className="flex flex-wrap items-center gap-8 sm:gap-12">
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-8 sm:gap-12">
          {index > 0 && (
            <div
              className={`hidden h-12 w-px sm:block ${
                isInk ? "bg-ink-border" : "bg-border"
              }`}
              aria-hidden
            />
          )}
          <div>
            <div
              className={`font-display text-4xl leading-none tracking-tight sm:text-5xl ${
                isInk ? "text-accent" : "text-primary"
              }`}
            >
              <AnimatedCounter value={stat.value} />
            </div>
            <div
              className={`mt-1.5 text-sm font-medium uppercase tracking-wide ${
                isInk ? "text-ink-muted-foreground" : "text-muted-foreground"
              }`}
            >
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
