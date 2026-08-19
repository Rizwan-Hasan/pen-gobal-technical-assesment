import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EnrolmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";
import { isOverdue, outstandingBalance, toNumber } from "@/lib/fees";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { FeeMeter } from "@/components/fee-meter";
import { PageHeader } from "@/components/page-header";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Students" };

const statusTone: Record<EnrolmentStatus, BadgeTone> = {
  ENROLLED: "brand",
  COMPLETED: "neutral",
  DEFERRED: "caution",
  WITHDRAWN: "negative",
};

function statusLabel(status: EnrolmentStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; programmeId?: string; status?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const programmeId = sp.programmeId || undefined;
  const status = (sp.status as EnrolmentStatus | undefined) || undefined;
  const filtered = Boolean(q || programmeId || status);

  const programmes = await prisma.programme.findMany({ orderBy: { code: "asc" } });
  const students = await prisma.student.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { studentId: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        programmeId ? { programmeId } : {},
        status ? { status } : {},
      ],
    },
    include: { programme: true, payments: true },
    orderBy: { studentId: "asc" },
  });

  const rows = students.map((s) => {
    const fee = toNumber(s.feeAmount);
    const balance = outstandingBalance(s.feeAmount, s.payments);
    return {
      id: s.id,
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email,
      programme: s.programme,
      status: s.status,
      fee,
      balance,
      paid: Math.max(0, fee - Math.max(0, balance)),
      overdue: isOverdue(s.feeAmount, s.payments, s.feeDueDate),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Students"
        description="Every enrolment record the Registry holds, with the fee balance attached to it."
        actions={
          <Link href="/students/new">
            <Button>
              <Plus aria-hidden />
              Enrol student
            </Button>
          </Link>
        }
      />

      <Card className="p-3 sm:p-4">
        <form className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
            />
            <Input
              name="q"
              defaultValue={q}
              className="pl-9"
              placeholder="Search name, student ID or email"
              aria-label="Search students"
            />
          </div>
          <Select
            name="programmeId"
            defaultValue={programmeId ?? ""}
            aria-label="Programme"
          >
            <option value="">All programmes</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={status ?? ""} aria-label="Status">
            <option value="">All statuses</option>
            {Object.values(EnrolmentStatus).map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="flex-1">
              Apply filters
            </Button>
            {filtered && (
              <Link href="/students">
                <Button type="button" variant="ghost">
                  Clear
                </Button>
              </Link>
            )}
          </div>
        </form>
      </Card>

      <p className="text-sm text-ink-muted">
        <span className="tabular font-medium text-ink">{rows.length}</span>{" "}
        {rows.length === 1 ? "record" : "records"}
        {filtered && " matching these filters"}
      </p>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="No students match these filters"
            description="Widen the search, or enrol the student if they are not on the register yet."
            action={
              <Link href="/students/new">
                <Button variant="secondary" size="sm">
                  Enrol student
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Register view — from md up there is room for the full row. */}
            <TableScroll className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Student ID</Th>
                    <Th>Name</Th>
                    <Th>Programme</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Balance</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <Tr key={s.id}>
                      <Td className="record whitespace-nowrap">
                        <Link
                          href={`/students/${s.id}`}
                          className="hover:text-brand hover:underline"
                        >
                          {s.studentId}
                        </Link>
                      </Td>
                      <Td>
                        <Link
                          href={`/students/${s.id}`}
                          className="font-medium hover:text-brand hover:underline"
                        >
                          {s.fullName}
                        </Link>
                        <div className="text-xs text-ink-faint">{s.email}</div>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className="record">{s.programme.code}</span>
                        <div className="text-xs text-ink-faint">
                          {s.programme.name}
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={statusTone[s.status]}>
                          {statusLabel(s.status)}
                        </Badge>
                      </Td>
                      <Td className="w-40">
                        <div
                          className={`tabular text-right font-medium ${
                            s.overdue ? "text-negative" : "text-ink"
                          }`}
                        >
                          {formatMoney(s.balance)}
                        </div>
                        <FeeMeter
                          size="sm"
                          className="mt-1.5"
                          fee={s.fee}
                          paid={s.paid}
                          overdue={s.overdue}
                        />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>

            {/* Below md each record becomes its own card. */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/students/${s.id}`}
                    className="block p-4 transition-colors hover:bg-elevated"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.fullName}</p>
                        <p className="record mt-0.5 text-ink-faint">
                          {s.studentId} · {s.programme.code}
                        </p>
                      </div>
                      <Badge tone={statusTone[s.status]}>
                        {statusLabel(s.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <span className="text-xs text-ink-muted">
                        Balance outstanding
                      </span>
                      <span
                        className={`tabular text-sm font-medium ${
                          s.overdue ? "text-negative" : "text-ink"
                        }`}
                      >
                        {formatMoney(s.balance)}
                      </span>
                    </div>
                    <FeeMeter
                      size="sm"
                      className="mt-1.5"
                      fee={s.fee}
                      paid={s.paid}
                      overdue={s.overdue}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
