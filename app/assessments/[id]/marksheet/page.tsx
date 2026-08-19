import Link from "next/link";
import { notFound } from "next/navigation";
import { saveGrade, setResultPublished } from "@/app/actions/results";
import { ActionForm } from "@/components/action-form";
import { ClassificationBadge, GradeMeter, GradeScaleKey } from "@/components/grade";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Meter } from "@/components/ui/meter";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";

async function togglePublished(formData: FormData) {
  "use server";
  await setResultPublished(
    String(formData.get("assessmentId")),
    String(formData.get("studentId")),
    formData.get("publish") === "true",
  );
}

export default async function MarksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({ where: { id } });
  if (!assessment) notFound();

  const students = await prisma.student.findMany({
    where: { status: { in: ["ENROLLED", "COMPLETED", "DEFERRED"] } },
    orderBy: { studentId: "asc" },
  });
  const results = await prisma.result.findMany({ where: { assessmentId: id } });
  const byStudent = new Map(results.map((r) => [r.studentId, r]));

  const graded = results.length;
  const published = results.filter((r) => r.publishedAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${assessment.module} · Marksheet`}
        title={assessment.title}
        description="Enter a grade out of 100 for each student, then publish it when the result is ready for them to see."
        actions={
          <Link href={`/assessments/${assessment.id}`}>
            <Button variant="outline">Back to assessment</Button>
          </Link>
        }
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-[12rem] flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow">Marking progress</p>
              <p className="tabular text-sm text-ink-muted">
                {graded} of {students.length} graded · {published} published
              </p>
            </div>
            <Meter
              size="lg"
              className="mt-3"
              max={Math.max(students.length, 1)}
              segments={[
                { value: published, tone: "brand", label: "Published" },
                { value: graded - published, tone: "caution", label: "Withheld" },
              ]}
            />
          </div>
          <div>
            <p className="eyebrow mb-2">Classification scale</p>
            <GradeScaleKey />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="Students"
          description="Grades save one row at a time."
        />
        {students.length === 0 ? (
          <EmptyState
            title="No students to mark"
            description="Only enrolled, deferred and completed students appear on a marksheet."
          />
        ) : (
          <>
            <TableScroll className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th className="w-44">Grade</Th>
                    <Th className="w-48">On the scale</Th>
                    <Th>Classification</Th>
                    <Th>Result</Th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const r = byStudent.get(s.id);
                    return (
                      <Tr key={s.id} className="align-top">
                        <Td>
                          <div className="font-medium">{s.fullName}</div>
                          <div className="record mt-0.5 text-ink-faint">
                            {s.studentId}
                          </div>
                        </Td>
                        <Td>
                          <ActionForm
                            action={saveGrade}
                            submitLabel="Save"
                            pendingLabel="…"
                            successMessage="Saved"
                            layout="inline"
                            size="sm"
                            variant="secondary"
                          >
                            <input type="hidden" name="assessmentId" value={id} />
                            <input type="hidden" name="studentId" value={s.id} />
                            <Input
                              name="grade"
                              type="number"
                              min={0}
                              max={100}
                              className="h-8 w-20"
                              aria-label={`Grade for ${s.fullName}`}
                              defaultValue={r?.grade ?? ""}
                              required
                            />
                          </ActionForm>
                        </Td>
                        <Td>
                          {r ? (
                            <GradeMeter grade={r.grade} />
                          ) : (
                            <span className="text-sm text-ink-faint">—</span>
                          )}
                        </Td>
                        <Td>
                          {r ? (
                            <ClassificationBadge grade={r.grade} />
                          ) : (
                            <span className="text-sm text-ink-faint">—</span>
                          )}
                        </Td>
                        <Td>
                          {r ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {r.publishedAt ? (
                                <Badge tone="brand">Published</Badge>
                              ) : (
                                <Badge tone="caution">Withheld</Badge>
                              )}
                              <form action={togglePublished}>
                                <input type="hidden" name="assessmentId" value={id} />
                                <input type="hidden" name="studentId" value={s.id} />
                                <input
                                  type="hidden"
                                  name="publish"
                                  value={r.publishedAt ? "false" : "true"}
                                />
                                <Button type="submit" size="sm" variant="outline">
                                  {r.publishedAt ? "Withhold" : "Publish"}
                                </Button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-sm text-ink-faint">
                              Enter a grade first
                            </span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableScroll>

            <ul className="divide-y divide-line md:hidden">
              {students.map((s) => {
                const r = byStudent.get(s.id);
                return (
                  <li key={s.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.fullName}</p>
                        <p className="record mt-0.5 text-ink-faint">
                          {s.studentId}
                        </p>
                      </div>
                      {r ? (
                        <ClassificationBadge grade={r.grade} />
                      ) : (
                        <Badge>Not graded</Badge>
                      )}
                    </div>

                    {r && <GradeMeter grade={r.grade} />}

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <ActionForm
                        action={saveGrade}
                        submitLabel="Save grade"
                        successMessage="Saved"
                        layout="inline"
                        size="sm"
                        variant="secondary"
                      >
                        <input type="hidden" name="assessmentId" value={id} />
                        <input type="hidden" name="studentId" value={s.id} />
                        <Input
                          name="grade"
                          type="number"
                          min={0}
                          max={100}
                          className="h-9 w-24"
                          aria-label={`Grade for ${s.fullName}`}
                          defaultValue={r?.grade ?? ""}
                          required
                        />
                      </ActionForm>

                      {r && (
                        <form action={togglePublished}>
                          <input type="hidden" name="assessmentId" value={id} />
                          <input type="hidden" name="studentId" value={s.id} />
                          <input
                            type="hidden"
                            name="publish"
                            value={r.publishedAt ? "false" : "true"}
                          />
                          <Button type="submit" size="sm" variant="outline">
                            {r.publishedAt ? "Withhold result" : "Publish result"}
                          </Button>
                        </form>
                      )}
                    </div>
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
