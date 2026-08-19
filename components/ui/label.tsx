import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-ink", className)}
      {...props}
    />
  );
}

/** Label + control + optional hint, stacked. */
export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
