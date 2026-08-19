import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClasses =
  "flex h-10 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-line-strong focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50 file:mr-3 file:h-7 file:cursor-pointer file:rounded-md file:border-0 file:bg-elevated file:px-3 file:text-xs file:font-medium file:text-ink";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClasses, className)} {...props} />
));
Input.displayName = "Input";
