"use client";

import { useActionState } from "react";
import { CircleAlert, Check } from "lucide-react";
import type { ActionResult } from "@/app/actions/students";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  pendingLabel,
  successMessage = "Saved",
  layout = "stacked",
  size,
  variant,
  className,
  formClassName,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  successMessage?: string;
  /** "inline" keeps the fields and the button on one row — used inside table cells. */
  layout?: "stacked" | "inline";
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  /** Applied to the fields container, so callers control the field grid. */
  className?: string;
  formClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => action(formData),
    null,
  );
  const stacked = layout === "stacked";

  return (
    <form
      action={formAction}
      className={cn(
        stacked ? "space-y-5" : "flex flex-wrap items-end gap-2",
        formClassName,
      )}
    >
      <div className={className}>{children}</div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button type="submit" size={size} variant={variant} disabled={pending}>
          {pending ? (pendingLabel ?? "Saving…") : submitLabel}
        </Button>

        {state && !state.ok && (
          <p
            role="alert"
            className="flex items-center gap-1.5 text-sm text-negative"
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p className="flex items-center gap-1.5 text-sm text-brand">
            <Check className="size-4 shrink-0" aria-hidden />
            {successMessage}
          </p>
        )}
      </div>
    </form>
  );
}
