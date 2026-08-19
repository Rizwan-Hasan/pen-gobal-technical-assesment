import { EmptyState } from "@/components/empty-state";
import { FeeMeter } from "@/components/fee-meter";
import { PageHeader } from "@/components/page-header";
import { Stat } from "@/components/stat";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/table";
import { isOverdue, outstandingBalance, toNumber } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/role";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "My fees" };

export default async function StudentFeesPage() {
  const session = await requireStudent();
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: session.actingStudent!.id },
    include: { payments: { orderBy: { paidAt: "desc" } } },
  });

  const fee = toNumber(student.feeAmount);
  const balance = outstandingBalance(student.feeAmount, student.payments);
  const paid = Math.max(0, fee - Math.max(0, balance));
  const overdue = isOverdue(student.feeAmount, student.payments, student.feeDueDate);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${student.studentId} · Fees`}
        title="My fees"
        description="Registry records payments by hand, so a recent transfer can take a day or two to appear."
        actions={
          overdue ? (
            <Badge tone="negative" emphasis="solid">
              Past due
            </Badge>
          ) : balance > 0 ? (
            <Badge tone="neutral">Balance outstanding</Badge>
          ) : (
            <Badge tone="brand">Paid in full</Badge>
          )
        }
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="eyebrow">Paid against the year&apos;s fee</p>
          <p className="tabular text-sm text-ink-muted">
            {formatMoney(paid)} of {formatMoney(fee)}
          </p>
        </div>
        <FeeMeter size="lg" className="mt-3" fee={fee} paid={paid} overdue={overdue} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Fee for the year" value={formatMoney(fee)} />
        <Stat
          label="Outstanding"
          value={formatMoney(balance)}
          tone={balance > 0 ? "negative" : "brand"}
        />
        <Stat
          label="Due date"
          value={formatDate(student.feeDueDate)}
          hint={overdue ? "This date has passed" : undefined}
          tone={overdue ? "negative" : "default"}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Payments received"
          action={
            <span className="tabular text-sm text-ink-muted">
              {student.payments.length}{" "}
              {student.payments.length === 1 ? "entry" : "entries"}
            </span>
          }
        />
        {student.payments.length === 0 ? (
          <EmptyState
            title="No payments recorded"
            description="Once Registry records a payment against your account, it is listed here."
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
  );
}
