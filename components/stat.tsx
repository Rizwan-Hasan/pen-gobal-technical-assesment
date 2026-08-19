import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  children,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "negative" | "brand";
  /** A meter or badge drawn under the figure. */
  children?: React.ReactNode;
  className?: string;
}) {
  const valueTone = {
    default: "text-ink",
    negative: "text-negative",
    brand: "text-brand",
  }[tone];

  return (
    <Card className={cn("flex flex-col justify-between p-4 sm:p-5", className)}>
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "tabular mt-3 text-3xl leading-none font-semibold",
          valueTone,
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-ink-faint">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}
