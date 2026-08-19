import { cn } from "@/lib/utils";

export type MeterTone = "brand" | "caution" | "negative" | "neutral";

const fills: Record<MeterTone, string> = {
  brand: "bg-brand",
  caution: "bg-caution",
  negative: "bg-negative",
  neutral: "bg-ink-faint",
};

const heights = {
  sm: "h-1",
  default: "h-1.5",
  lg: "h-2.5",
} as const;

export type MeterSegment = { value: number; tone: MeterTone; label?: string };

/**
 * The measured rule: the one device this registry is built around. Every figure
 * that has a scale — a grade against its classification thresholds, a fee
 * against what has been paid, a cohort against its statuses — is drawn on it.
 */
export function Meter({
  segments,
  max,
  ticks,
  size = "default",
  className,
}: {
  segments: MeterSegment[];
  /** Defaults to the sum of the segments (a distribution rather than a scale). */
  max?: number;
  /** Threshold positions, in the same units as the values. */
  ticks?: number[];
  size?: keyof typeof heights;
  className?: string;
}) {
  const total = max ?? segments.reduce((sum, s) => sum + s.value, 0);
  const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  return (
    <div
      className={cn(
        "relative flex w-full overflow-hidden rounded-full bg-line",
        heights[size],
        className,
      )}
    >
      {segments.map((segment, i) => (
        <span
          key={segment.label ?? i}
          className={fills[segment.tone]}
          style={{ width: `${Math.max(0, Math.min(100, pct(segment.value)))}%` }}
        />
      ))}
      {ticks?.map((tick) => (
        <span
          key={tick}
          aria-hidden
          className="absolute top-0 h-full w-px bg-surface"
          style={{ left: `${pct(tick)}%` }}
        />
      ))}
    </div>
  );
}
