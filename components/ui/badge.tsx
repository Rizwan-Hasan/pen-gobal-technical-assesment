import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "brand" | "caution" | "negative";
export type BadgeEmphasis = "soft" | "solid" | "outline";

const tones: Record<BadgeTone, Record<BadgeEmphasis, string>> = {
  neutral: {
    soft: "border-line bg-elevated text-ink-muted",
    solid: "border-transparent bg-ink text-canvas",
    outline: "border-line-strong text-ink-muted",
  },
  brand: {
    soft: "border-transparent bg-brand-soft text-brand-ink",
    solid: "border-transparent bg-brand text-on-brand",
    outline: "border-brand/40 text-brand",
  },
  caution: {
    soft: "border-transparent bg-caution-soft text-caution-ink",
    solid: "border-transparent bg-caution text-surface",
    outline: "border-caution/40 text-caution",
  },
  negative: {
    soft: "border-transparent bg-negative-soft text-negative-ink",
    solid: "border-transparent bg-negative text-surface",
    outline: "border-negative/40 text-negative",
  },
};

export function Badge({
  className,
  tone = "neutral",
  emphasis = "soft",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  emphasis?: BadgeEmphasis;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone][emphasis],
        className,
      )}
      {...props}
    />
  );
}

/** A small filled dot used inside badges and legends to carry the tone. */
export function ToneDot({
  tone,
  className,
}: {
  tone: BadgeTone;
  className?: string;
}) {
  const fill = {
    neutral: "bg-ink-faint",
    brand: "bg-brand",
    caution: "bg-caution",
    negative: "bg-negative",
  }[tone];
  return (
    <span
      aria-hidden
      className={cn("size-1.5 shrink-0 rounded-full", fill, className)}
    />
  );
}
