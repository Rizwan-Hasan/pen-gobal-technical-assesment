import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isOverdue, outstandingBalance, toNumber } from "@/lib/fees";
import { Badge, ToneDot } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Meter, type MeterTone } from "@/components/ui/meter";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Stat } from "@/components/stat";
import { formatMoney, formatDate } from "@/lib/utils";
import { requireStaff } from "@/lib/role";

const statusOrder = [
  { key: "ENROLLED", label: "Enrolled", tone: "brand" },
  { key: "COMPLETED", label: "Completed", tone: "neutral" },
  { key: "DEFERRED", label: "Deferred", tone: "caution" },
  { key: "WITHDRAWN", label: "Withdrawn", tone: "negative" },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  tone: MeterTone;
}>;

export default async function DashboardPage() {
  await requireStaff();

  const students = await prisma.student.findMany({
    include: { payments: true, programme: true },
  });
  const lateSubs = await prisma.submission.count({ where: { isLate: true } });
  const unpublished = await prisma.result.count({ where: { publishedAt: null } });
  const now = new Date();
  const assessments = await prisma.assessment.findMany({
    orderBy: { deadline: "asc" },
    take: 6,
  });

  const byStatus = { ENROLLED: 0, DEFERRED: 0, WITHDRAWN: 0, COMPLETED: 0 };
  let billed = 0;
  let collected = 0;
  let outstandingTotal = 0;
  let overdueTotal = 0;
  const overdue: Array<{
    id: string;
    studentId: string;
    fullName: string;
    programme: string;
    balance: number;
    due: Date;
  }> = [];

  for (const s of students) {
    byStatus[s.status] += 1;

    const fee = toNumber(s.feeAmount);
    const paid = s.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
    const balance = outstandingBalance(s.feeAmount, s.payments);

    billed += fee;
    collected += Math.min(paid, fee);
    outstandingTotal += Math.max(0, balance);

    if (isOverdue(s.feeAmount, s.payments, s.feeDueDate)) {
      overdueTotal += Math.max(0, balance);
      overdue.push({
        id: s.id,
        studentId: s.studentId,
        fullName: s.fullName,
        programme: s.programme.code,
        balance,
        due: s.feeDueDate,
      });
    }
  }
  overdue.sort((a, b) => b.balance - a.balance);

  const notYetDue = Math.max(0, outstandingTotal - overdueTotal);
  const collectedShare = billed > 0 ? Math.round((collected / billed) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Registry"
        title="The register today"
        description="Where the cohort stands on enrolment, fees, submissions and results."
      />

      {/* The two measures the registry is judged on, drawn on the same rule. */}
      <Card>
        <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
          <section className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow">Enrolment</p>
              <p className="tabular text-sm text-ink-muted">
                {students.length} on the register
              </p>
            </div>
            <Meter
              size="lg"
              className="mt-3"
              segments={statusOrder.map((s) => ({
                value: byStatus[s.key],
                tone: s.tone,
                label: s.label,
              }))}
            />
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
              {statusOrder.map((s) => (
                <li key={s.key}>
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <ToneDot tone={s.tone} />
                    {s.label}
                  </span>
                  <span className="tabular mt-0.5 block text-xl font-semibold">
                    {byStatus[s.key]}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow">Fee collection</p>
              <p className="tabular text-sm text-ink-muted">
                {collectedShare}% of {formatMoney(billed)}
              </p>
            </div>
            <Meter
              size="lg"
              className="mt-3"
              max={billed}
              segments={[
                { value: collected, tone: "brand", label: "Collected" },
                { value: notYetDue, tone: "neutral", label: "Not yet due" },
                { value: overdueTotal, tone: "negative", label: "Overdue" },
              ]}
            />
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {[
                { label: "Collected", value: collected, tone: "brand" },
                { label: "Not yet due", value: notYetDue, tone: "neutral" },
                { label: "Overdue", value: overdueTotal, tone: "negative" },
              ].map((row) => (
                <li key={row.label}>
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <ToneDot tone={row.tone as MeterTone} />
                    {row.label}
                  </span>
                  <span className="tabular mt-0.5 block text-xl font-semibold">
                    {formatMoney(row.value)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Outstanding fees"
          value={formatMoney(outstandingTotal)}
          hint={`Across ${students.length} students`}
        />
        <Stat
          label="Overdue accounts"
          value={overdue.length}
          hint={
            overdue.length ? formatMoney(overdueTotal) + " past due" : "Nothing past due"
          }
          tone={overdue.length ? "negative" : "default"}
        />
        <Stat
          label="Late submissions"
          value={lateSubs}
          hint="Flagged on receipt"
        />
        <Stat
          label="Results withheld"
          value={unpublished}
          hint="Graded, not yet published"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Overdue balances"
            description="Fees past their due date, largest first."
            action={
              <Badge tone={overdue.length ? "negative" : "brand"}>
                {overdue.length} flagged
              </Badge>
            }
          />
          {overdue.length === 0 ? (
            <EmptyState
              title="Every account is current"
              description="No student has passed their fee due date with a balance outstanding."
            />
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th className="text-right">Balance</Th>
                    <Th>Due</Th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((o) => (
                    <Tr key={o.id}>
                      <Td>
                        <Link
                          className="font-medium hover:text-brand hover:underline"
                          href={`/students/${o.id}`}
                        >
                          {o.fullName}
                        </Link>
                        <div className="record mt-0.5 text-ink-faint">
                          {o.studentId} · {o.programme}
                        </div>
                      </Td>
                      <Td className="tabular text-right font-medium text-negative">
                        {formatMoney(o.balance)}
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(o.due)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </Card>

        <Card className="lg:col-span-2 lg:self-start">
          <CardHeader
            title="Assessment deadlines"
            action={
              <Link
                href="/assessments"
                className="flex items-center gap-0.5 text-sm text-brand hover:underline"
              >
                All assessments
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          {assessments.length === 0 ? (
            <EmptyState
              title="No assessments set"
              description="Create one to start collecting submissions."
            />
          ) : (
            <CardBody className="space-y-3">
              {assessments.map((a) => {
                const past = a.deadline < now;
                return (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/assessments/${a.id}`}
                        className="block truncate text-sm font-medium hover:text-brand hover:underline"
                      >
                        {a.title}
                      </Link>
                      <p className="record text-ink-faint">
                        {a.module} · {formatDate(a.deadline)}
                      </p>
                    </div>
                    <Badge tone={past ? "neutral" : "brand"}>
                      {past ? "Closed" : "Open"}
                    </Badge>
                  </div>
                );
              })}
            </CardBody>
          )}
        </Card>
      </div>
    </div>
  );
}
