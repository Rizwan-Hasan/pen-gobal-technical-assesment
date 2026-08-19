import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-4",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-1.5 text-3xl leading-tight text-ink sm:text-[2rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-prose text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
