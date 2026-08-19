import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }
>(({ className, wrapperClassName, children, ...props }, ref) => (
  <div className={cn("relative", wrapperClassName)}>
    <select
      ref={ref}
      className={cn(
        "h-10 w-full appearance-none rounded-lg border border-line bg-surface pr-9 pl-3 text-sm text-ink transition-colors hover:border-line-strong focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
    />
  </div>
));
Select.displayName = "Select";
