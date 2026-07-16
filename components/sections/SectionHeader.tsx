import { Reveal } from "@/components/motion/Reveal";

interface SectionHeaderProps {
  label?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "ink";
}

export function SectionHeader({
  label,
  title,
  description,
  align = "center",
  tone = "light",
}: SectionHeaderProps) {
  const isInk = tone === "ink";

  return (
    <Reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      {label && (
        <span
          className={`inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] ${
            isInk ? "text-accent" : "text-primary"
          }`}
        >
          <span className={`h-px w-6 ${isInk ? "bg-accent" : "bg-primary"}`} />
          {label}
        </span>
      )}
      <h2
        className={`mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl ${
          isInk ? "text-ink-foreground" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-lg ${
            isInk ? "text-ink-muted-foreground" : "text-muted-foreground"
          }`}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
