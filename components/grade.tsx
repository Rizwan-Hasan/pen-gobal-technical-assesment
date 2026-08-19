import { Badge, type BadgeEmphasis, type BadgeTone } from "@/components/ui/badge";
import { Meter, type MeterTone } from "@/components/ui/meter";
import {
  CLASSIFICATION_THRESHOLDS,
  classificationLabel,
  classifyGrade,
  type Classification,
} from "@/lib/classification";
import { cn } from "@/lib/utils";

/** Rank is carried by weight, not by hue: a distinction fills, a merit tints. */
const chip: Record<Classification, { tone: BadgeTone; emphasis: BadgeEmphasis }> = {
  DISTINCTION: { tone: "brand", emphasis: "solid" },
  MERIT: { tone: "brand", emphasis: "soft" },
  PASS: { tone: "neutral", emphasis: "soft" },
  FAIL: { tone: "negative", emphasis: "soft" },
};

const meterTone: Record<Classification, MeterTone> = {
  DISTINCTION: "brand",
  MERIT: "brand",
  PASS: "neutral",
  FAIL: "negative",
};

export function ClassificationBadge({ grade }: { grade: number }) {
  const classification = classifyGrade(grade);
  const { tone, emphasis } = chip[classification];
  return (
    <Badge tone={tone} emphasis={emphasis}>
      {classificationLabel(classification)}
    </Badge>
  );
}

/** A grade drawn on the 0–100 rule, notched at 40 / 60 / 70. */
export function GradeMeter({
  grade,
  className,
}: {
  grade: number;
  className?: string;
}) {
  return (
    <Meter
      className={className}
      max={100}
      ticks={CLASSIFICATION_THRESHOLDS}
      segments={[{ value: grade, tone: meterTone[classifyGrade(grade)] }]}
    />
  );
}

/** Explains the notches once, so individual rows can stay bare. */
export function GradeScaleKey({ className }: { className?: string }) {
  return (
    <div className={cn("w-full max-w-xs", className)}>
      <Meter max={100} ticks={CLASSIFICATION_THRESHOLDS} segments={[]} />
      <p className="record mt-1.5 text-ink-faint">
        40 pass · 60 merit · 70 distinction
      </p>
    </div>
  );
}
