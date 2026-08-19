import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ClassificationBadge, GradeMeter } from "@/components/grade";
import { EmptyState } from "@/components/empty-state";
import { FeeMeter } from "@/components/fee-meter";
import { PageHeader } from "@/components/page-header";
import { Stat } from "@/components/stat";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { isOverdue, outstandingBalance, toNumber } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/role";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function StudentHomePage() {
  const session = await requireStudent();
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: session.actingStudent!.id },
    include: {
      payments: true,
      programme: true,
      results: {
        where: { publishedAt: { not: null } },
        include: { assessment: true },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  const fee = toNumber(student.feeAmount);
  const balance = outstandingBalance(student.feeAmount, student.payments);
  const paid = Math.max(0, fee - Math.max(0, balance));
  const overdue = isOverdue(student.feeAmount, student.payments, student.feeDueDate);
  const now = new Date();

  const openAssessments = await prisma.assessment.findMany({
    where: { deadline: { gt: now } },
    orderBy: { deadline: "asc" },
    take: 5,
  });

  const firstName = student.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${student.studentId} · ${student.programme.code}`}
        title={`Hello, ${firstName}`}
        description={`${student.programme.name} · ${student.academicYear}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          label="Outstanding balance"
          value={formatMoney(balance)}
          tone={balance > 0 ? "negative" : "brand"}
          hint={
            overdue
              ? `Payment was due ${formatDate(student.feeDueDate)}`
              : `Due ${formatDate(student.feeDueDate)}`
          }
        >
          <FeeMeter fee={fee} paid={paid} overdue={overdue} />
        </Stat>
        <Stat
          label="Fee for the year"
          value={formatMoney(fee)}
          hint={`${formatMoney(paid)} received so far`}
        />
        <Stat
          label="Results published"
          value={student.results.length}
          hint="Withheld results stay hidden until Registry releases them"
        />
      </div>

      {overdue && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-negative/30 bg-negative-soft p-4">
          <p className="text-sm text-negative-ink">
            Your fees are past their due date. Registry records payments manually,
            so a recent transfer may not show yet.
          </p>
          <Link href="/student/fees">
            <Button variant="outline" size="sm">
              View fee record
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Open assessments"
            action={
              <Link
                href="/student/assessments"
                className="flex items-center gap-0.5 text-sm text-brand hover:underline"
              >
                Submit work
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          {openAssessments.length === 0 ? (
            <EmptyState
              title="Nothing open right now"
              description="New assessments appear here as soon as they are set."
            />
          ) : (
            <ul className="divide-y divide-line">
              {openAssessments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="record mt-0.5 text-ink-faint">{a.module}</p>
                  </div>
                  <span className="text-sm text-ink-muted">
                    Due {formatDate(a.deadline)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Latest results"
            action={
              <Link
                href="/student/marksheet"
                className="flex items-center gap-0.5 text-sm text-brand hover:underline"
              >
                Full marksheet
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          {student.results.length === 0 ? (
            <EmptyState
              title="No results published yet"
              description="Grades appear once Registry publishes them."
            />
          ) : (
            <CardBody className="space-y-4">
              {student.results.slice(0, 3).map((r) => (
                <div key={r.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.assessment.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="tabular text-sm font-semibold">
                        {r.grade}
                      </span>
                      <ClassificationBadge grade={r.grade} />
                    </div>
                  </div>
                  <GradeMeter grade={r.grade} className="mt-2" />
                </div>
              ))}
            </CardBody>
          )}
        </Card>
      </div>
    </div>
  );
}
