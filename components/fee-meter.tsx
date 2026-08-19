import { Meter, type MeterSegment } from "@/components/ui/meter";

/**
 * The fee drawn on the rule: what has been received, and — once the due date has
 * passed — what is still owed. Before the due date the remainder stays as bare
 * track, because nothing is wrong yet.
 */
export function FeeMeter({
  fee,
  paid,
  overdue,
  size = "default",
  className,
}: {
  fee: number;
  paid: number;
  overdue: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const outstanding = Math.max(0, fee - paid);
  const segments: MeterSegment[] = [{ value: paid, tone: "brand" }];
  if (overdue && outstanding > 0) {
    segments.push({ value: outstanding, tone: "negative" });
  }

  return (
    <Meter
      size={size}
      className={className}
      max={Math.max(fee, 1)}
      segments={segments}
    />
  );
}
