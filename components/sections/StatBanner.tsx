interface Stat {
  value: string;
  label: string;
}

export function StatBanner({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex flex-wrap items-center gap-6 sm:gap-10">
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-6 sm:gap-10">
          {index > 0 && (
            <div className="hidden h-10 w-px bg-border sm:block" aria-hidden />
          )}
          <div>
            <div className="font-display text-3xl text-primary sm:text-4xl">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
