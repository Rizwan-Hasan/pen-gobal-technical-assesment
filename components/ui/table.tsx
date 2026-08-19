import { cn } from "@/lib/utils";

/** Scroll container so wide registers stay readable on small screens. */
export function TableScroll({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      tabIndex={0}
      className={cn("-mx-px overflow-x-auto", className)}
      {...props}
    />
  );
}

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full min-w-full border-collapse text-left text-sm", className)}
      {...props}
    />
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-elevated px-4 py-2.5 text-[0.6875rem] font-medium tracking-[0.1em] text-ink-faint uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b border-line px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}

export function Tr({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors last:[&>td]:border-b-0 hover:bg-elevated/70",
        className,
      )}
      {...props}
    />
  );
}
