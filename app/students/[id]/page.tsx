import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Pencil } from "lucide-react";
import { recordPayment } from "@/app/actions/payments";
import { ActionForm } from "@/components/action-form";
import { ClassificationBadge, GradeMeter } from "@/components/grade";
import { EmptyState } from "@/components/empty-state";
import { FeeMeter } from "@/components/fee-meter";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/table";
import { isOverdue, outstandingBalance, toNumber } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      programme: true,
      payments: { orderBy: { paidAt: "desc" } },
      submissions: { include: { assessment: true }, orderBy: { submittedAt: "desc" } },
      results: { include: { assessment: true } },
    },
  });
  if (!student) notFound();

  const fee = toNumber(student.feeAmount);
  const balance = outstandingBalance(student.feeAmount, student.payments);
  const paid = Math.max(0, fee - Math.max(0, balance));
  const overdue = isOverdue(student.feeAmount, student.payments, student.feeDueDate);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={student.studentId}
        title={student.fullName}
        description={student.email}
        actions={
          <>
            <Badge tone={overdue ? "negative" : "neutral"}>
              {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
            </Badge>
            {overdue && (
              <Badge tone="negative" emphasis="solid">
                Fees overdue
              </Badge>
            )}
            <Link href={`/students/${student.id}/edit`}>
              <Button variant="outline">
                <Pencil aria-hidden />
                Edit record
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="eyebrow">Programme</p>
          <p className="mt-2 font-medium">{student.programme.name}</p>
          <p className="record mt-1 text-ink-faint">
            {student.programme.code} · {student.academicYear}
          </p>
        </Card>
        <Card className="p-5">
          <p className="eyebrow">Fee</p>
          <p className="tabular mt-2 text-2xl font-semibold">
            {formatMoney(fee)}
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Due {formatDate(student.feeDueDate)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="eyebrow">Outstanding</p>
          <p
            className={`tabular mt-2 text-2xl font-semibold ${
              balance > 0 ? "text-negative" : "text-brand"
            }`}
          >
            {formatMoney(balance)}
          </p>
          <FeeMeter className="mt-3" fee={fee} paid={paid} overdue={overdue} />
          <p className="mt-2 text-xs text-ink-faint">
            {formatMoney(paid)} received of {formatMoney(fee)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Record a payment"
            description="Balances update as soon as the payment is saved."
          />
          <CardBody>
            <ActionForm
              action={recordPayment}
              submitLabel="Record payment"
              pendingLabel="Recording…"
              successMessage="Payment recorded"
              className="grid gap-4 sm:grid-cols-2"
            >
              <input type="hidden" name="studentId" value={student.id} />
              <Field label="Amount" htmlFor="amount">
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </Field>
              <Field label="Date received" htmlFor="paidAt">
                <Input
                  id="paidAt"
                  name="paidAt"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </Field>
              <Field
                label="Reference"
                htmlFor="reference"
                className="sm:col-span-2"
                hint="The reference shown on the bank statement."
              >
                <Input
                  id="reference"
                  name="reference"
                  required
                  placeholder="PAY-2025-0001"
                />
              </Field>
            </ActionForm>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Payment history"
            action={
              <span className="tabular text-sm text-ink-muted">
                {formatMoney(paid)} received
              </span>
            }
          />
          {student.payments.length === 0 ? (
            <EmptyState
              title="No payments recorded"
              description="The first payment you record will appear here."
            />
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Reference</Th>
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {student.payments.map((p) => (
                    <Tr key={p.id}>
                      <Td className="whitespace-nowrap">{formatDate(p.paidAt)}</Td>
                      <Td className="record text-ink-muted">{p.reference}</Td>
                      <Td className="tabular text-right font-medium">
                        {formatMoney(toNumber(p.amount))}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Submissions" />
          {student.submissions.length === 0 ? (
            <EmptyState
              title="Nothing submitted yet"
              description="Uploads made from the student portal are listed here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {student.submissions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {s.assessment.title}
                    </p>
                    <p className="record mt-0.5 text-ink-faint">
                      {formatDateTime(s.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.isLate && <Badge tone="caution">Late</Badge>}
                    <a
                      className="flex items-center gap-1 text-sm text-brand hover:underline"
                      href={`/api/submissions/${s.id}/download`}
                    >
                      <Download className="size-3.5" aria-hidden />
                      Download
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Results" />
          {student.results.length === 0 ? (
            <EmptyState
              title="No grades entered"
              description="Grades appear here once they are entered on a marksheet."
            />
          ) : (
            <>
            <TableScroll className="hidden sm:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Assessment</Th>
                    <Th className="w-40">Grade</Th>
                    <Th>Classification</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {student.results.map((r) => (
                    <Tr key={r.id}>
                      <Td className="font-medium">{r.assessment.title}</Td>
                      <Td>
                        <span className="tabular text-sm font-medium">
                          {r.grade}
                        </span>
                        <GradeMeter grade={r.grade} className="mt-1.5" />
                      </Td>
                      <Td>
                        <ClassificationBadge grade={r.grade} />
                      </Td>
                      <Td>
                        {r.publishedAt ? (
                          <Badge tone="brand">Published</Badge>
                        ) : (
                          <Badge tone="caution">Withheld</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>

            <ul className="divide-y divide-line sm:hidden">
              {student.results.map((r) => (
                <li key={r.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate font-medium">
                      {r.assessment.title}
                    </p>
                    <ClassificationBadge grade={r.grade} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="tabular text-sm font-semibold">
                      {r.grade}
                    </span>
                    {r.publishedAt ? (
                      <Badge tone="brand">Published</Badge>
                    ) : (
                      <Badge tone="caution">Withheld</Badge>
                    )}
                  </div>
                  <GradeMeter grade={r.grade} />
                </li>
              ))}
            </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
