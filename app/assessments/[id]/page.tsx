import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";
import { formatDateTime } from "@/lib/utils";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      submissions: {
        include: { student: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!assessment) notFound();

  const open = assessment.deadline > new Date();
  const late = assessment.submissions.filter((s) => s.isLate).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={assessment.module}
        title={assessment.title}
        description={`Deadline ${formatDateTime(assessment.deadline)}`}
        actions={
          <>
            <Badge tone={open ? "brand" : "neutral"}>
              {open ? "Open for submissions" : "Closed"}
            </Badge>
            <Link href={`/assessments/${assessment.id}/marksheet`}>
              <Button>Open marksheet</Button>
            </Link>
          </>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          title="Submissions"
          description={
            late > 0
              ? `${assessment.submissions.length} received · ${late} flagged late`
              : `${assessment.submissions.length} received`
          }
        />
        {assessment.submissions.length === 0 ? (
          <EmptyState
            title="Nothing submitted yet"
            description="Files uploaded from the student portal land here as they arrive."
          />
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Submitted</Th>
                  <Th>File</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {assessment.submissions.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <Link
                        href={`/students/${s.student.id}`}
                        className="font-medium hover:text-brand hover:underline"
                      >
                        {s.student.fullName}
                      </Link>
                      <div className="record mt-0.5 text-ink-faint">
                        {s.student.studentId}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {formatDateTime(s.submittedAt)}
                    </Td>
                    <Td>
                      <a
                        className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
                        href={`/api/submissions/${s.id}/download`}
                      >
                        <Download className="size-3.5 shrink-0" aria-hidden />
                        <span className="record">{s.fileName}</span>
                      </a>
                    </Td>
                    <Td>
                      {s.isLate ? (
                        <Badge tone="caution">Late</Badge>
                      ) : (
                        <Badge tone="brand">On time</Badge>
                      )}
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
