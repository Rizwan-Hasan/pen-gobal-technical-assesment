import type { Prisma } from "@prisma/client";

// Prisma 7 no longer ships the `runtime/library` entry point; Decimal is
// reached through the Prisma namespace.
type Decimal = Prisma.Decimal;

export function toNumber(value: Decimal | number | string) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

export function outstandingBalance(
  feeAmount: Decimal | number | string,
  payments: Array<{ amount: Decimal | number | string }>,
) {
  const paid = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  return Math.round((toNumber(feeAmount) - paid) * 100) / 100;
}

export function isOverdue(
  feeAmount: Decimal | number | string,
  payments: Array<{ amount: Decimal | number | string }>,
  feeDueDate: Date,
  now = new Date(),
) {
  return outstandingBalance(feeAmount, payments) > 0 && now > feeDueDate;
}

/** Academic year like 2025/26 → due date = 1 Sep of start year + 90 days */
export function feeDueDateFromAcademicYear(academicYear: string) {
  const startYear = Number(academicYear.slice(0, 4));
  if (!Number.isFinite(startYear)) {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d;
  }
  const start = new Date(Date.UTC(startYear, 8, 1)); // 1 Sep
  start.setUTCDate(start.getUTCDate() + 90);
  return start;
}
