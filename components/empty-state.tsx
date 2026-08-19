import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-12 text-center", className)}>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
