import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createAssessment } from "@/app/actions/assessments";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Meter } from "@/components/ui/meter";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Assessments" };

export default async function AssessmentsPage() {
  await requireStaff();
  const assessments = await prisma.assessment.findMany({
    orderBy: { deadline: "desc" },
    include: { _count: { select: { submissions: true, results: true } } },
  });
  const cohort = await prisma.student.count({
    where: { status: { in: ["ENROLLED", "COMPLETED", "DEFERRED"] } },
  });
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Assessments"
        description="Set deadlines, watch submissions arrive, and open the marksheet when marking starts."
      />

      <Card>
        <CardHeader
          title="Create an assessment"
          description="Students can submit from the moment it is created; anything after the deadline is flagged as late."
        />
        <CardBody>
          <ActionForm
            action={createAssessment}
            submitLabel="Create assessment"
            successMessage="Assessment created"
            className="grid gap-4 sm:grid-cols-3"
          >
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" required placeholder="Coursework 1" />
            </Field>
            <Field label="Module" htmlFor="module">
              <Input id="module" name="module" required placeholder="CS101" />
            </Field>
            <Field label="Deadline" htmlFor="deadline">
              <Input id="deadline" name="deadline" type="datetime-local" required />
            </Field>
          </ActionForm>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="All assessments"
          action={
            <span className="text-sm text-ink-muted">
              {cohort} students on the register
            </span>
          }
        />
        {assessments.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description="Create one above and it will appear in every student's portal."
          />
        ) : (
          <>
          <TableScroll className="hidden md:block">
            <Table>
              <thead>
                <tr>
                  <Th>Assessment</Th>
                  <Th>Deadline</Th>
                  <Th className="w-48">Submissions</Th>
                  <Th className="text-right">Marked</Th>
                  <Th>
                    <span className="sr-only">Marksheet</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => {
                  const open = a.deadline > now;
                  return (
                    <Tr key={a.id}>
                      <Td>
                        <Link
                          href={`/assessments/${a.id}`}
                          className="font-medium hover:text-brand hover:underline"
                        >
                          {a.title}
                        </Link>
                        <div className="record mt-0.5 text-ink-faint">
                          {a.module}
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <div className="text-sm">{formatDateTime(a.deadline)}</div>
                        <Badge
                          tone={open ? "brand" : "neutral"}
                          className="mt-1"
                        >
                          {open ? "Open" : "Closed"}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="tabular text-sm">
                          {a._count.submissions}{" "}
                          <span className="text-ink-faint">of {cohort}</span>
                        </div>
                        <Meter
                          size="sm"
                          className="mt-1.5"
                          max={Math.max(cohort, a._count.submissions, 1)}
                          segments={[
                            { value: a._count.submissions, tone: "brand" },
                          ]}
                        />
                      </Td>
                      <Td className="tabular text-right">{a._count.results}</Td>
                      <Td className="text-right whitespace-nowrap">
                        <Link
                          href={`/assessments/${a.id}/marksheet`}
                          className="inline-flex items-center gap-0.5 text-sm text-brand hover:underline"
                        >
                          Marksheet
                          <ChevronRight className="size-3.5" aria-hidden />
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>

          <ul className="divide-y divide-line md:hidden">
            {assessments.map((a) => {
              const open = a.deadline > now;
              return (
                <li key={a.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/assessments/${a.id}`}
                        className="block truncate font-medium hover:text-brand hover:underline"
                      >
                        {a.title}
                      </Link>
                      <p className="record mt-0.5 text-ink-faint">
                        {a.module} · {formatDateTime(a.deadline)}
                      </p>
                    </div>
                    <Badge tone={open ? "brand" : "neutral"}>
                      {open ? "Open" : "Closed"}
                    </Badge>
                  </div>

                  <div>
                    <div className="tabular flex items-baseline justify-between text-xs text-ink-muted">
                      <span>
                        {a._count.submissions} of {cohort} submitted
                      </span>
                      <span>{a._count.results} marked</span>
                    </div>
                    <Meter
                      size="sm"
                      className="mt-1.5"
                      max={Math.max(cohort, a._count.submissions, 1)}
                      segments={[{ value: a._count.submissions, tone: "brand" }]}
                    />
                  </div>

                  <Link
                    href={`/assessments/${a.id}/marksheet`}
                    className="inline-flex items-center gap-0.5 text-sm text-brand hover:underline"
                  >
                    Open marksheet
                    <ChevronRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
          </>
        )}
      </Card>
    </div>
  );
}
