import { ClassificationBadge, GradeMeter, GradeScaleKey } from "@/components/grade";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/role";

export const metadata = { title: "My marksheet" };

export default async function StudentMarksheetPage() {
  const session = await requireStudent();
  const studentId = session.actingStudent!.id;

  const assessments = await prisma.assessment.findMany({
    orderBy: { deadline: "desc" },
    include: { results: { where: { studentId } } },
  });

  const publishedGrades: number[] = [];
  for (const a of assessments) {
    const r = a.results[0];
    if (r?.publishedAt) publishedGrades.push(r.grade);
  }
  const average =
    publishedGrades.length > 0
      ? Math.round(
          publishedGrades.reduce((sum, g) => sum + g, 0) / publishedGrades.length,
        )
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My record"
        title="Marksheet"
        description="A grade appears here once Registry publishes it. Until then it stays pending, even if the work has been marked."
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Average of published grades</p>
            <p className="tabular mt-2 text-3xl leading-none font-semibold">
              {average ?? "—"}
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              {publishedGrades.length} of {assessments.length} results published
            </p>
          </div>
          <div>
            <p className="eyebrow mb-2">Classification scale</p>
            <GradeScaleKey />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Results" />
        {assessments.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description="Once assessments are set, your results are listed here."
          />
        ) : (
          <>
            <TableScroll className="hidden sm:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Assessment</Th>
                    <Th>Module</Th>
                    <Th className="w-48">Grade</Th>
                    <Th>Classification</Th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => {
                    const r = a.results[0];
                    const published = r?.publishedAt ? r : null;
                    return (
                      <Tr key={a.id}>
                        <Td className="font-medium">{a.title}</Td>
                        <Td className="record text-ink-muted">{a.module}</Td>
                        <Td>
                          {published ? (
                            <>
                              <span className="tabular text-sm font-semibold">
                                {published.grade}
                              </span>
                              <GradeMeter grade={published.grade} className="mt-1.5" />
                            </>
                          ) : (
                            <Badge>Pending</Badge>
                          )}
                        </Td>
                        <Td>
                          {published ? (
                            <ClassificationBadge grade={published.grade} />
                          ) : (
                            <span className="text-sm text-ink-faint">—</span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableScroll>

            <ul className="divide-y divide-line sm:hidden">
              {assessments.map((a) => {
                const r = a.results[0];
                const published = r?.publishedAt ? r : null;
                return (
                  <li key={a.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.title}</p>
                        <p className="record mt-0.5 text-ink-faint">{a.module}</p>
                      </div>
                      {published ? (
                        <ClassificationBadge grade={published.grade} />
                      ) : (
                        <Badge>Pending</Badge>
                      )}
                    </div>
                    {published && (
                      <>
                        <p className="tabular text-sm font-semibold">{published.grade}</p>
                        <GradeMeter grade={published.grade} />
                      </>
                    )}
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
