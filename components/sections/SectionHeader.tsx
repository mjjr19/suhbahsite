interface SectionHeaderProps {
  label?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  label,
  title,
  description,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      {label && (
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          {label}
        </span>
      )}
      <h2 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
