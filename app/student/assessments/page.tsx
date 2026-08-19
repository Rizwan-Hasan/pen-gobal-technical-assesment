import { Download } from "lucide-react";
import { submitAssessment } from "@/app/actions/assessments";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/role";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "My assessments" };

const ACCEPTED_FILES =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default async function StudentAssessmentsPage() {
  const session = await requireStudent();
  const studentId = session.actingStudent!.id;
  const assessments = await prisma.assessment.findMany({
    orderBy: { deadline: "desc" },
    include: { submissions: { where: { studentId } } },
  });
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My work"
        title="Assessments"
        description="Upload a PDF or DOCX up to 10 MB. You can replace your file as often as you like before the deadline; a first submission made after it is accepted and flagged as late."
      />

      {assessments.length === 0 ? (
        <Card>
          <EmptyState
            title="No assessments set"
            description="Your assessments appear here as soon as Registry creates them."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {assessments.map((a) => {
            const sub = a.submissions[0];
            const past = now > a.deadline;
            const canSubmit = !sub || !past;

            return (
              <Card key={a.id}>
                <CardHeader
                  title={a.title}
                  description={
                    <span className="record">
                      {a.module} · due {formatDateTime(a.deadline)}
                    </span>
                  }
                  action={
                    <>
                      {sub?.isLate && <Badge tone="caution">Late</Badge>}
                      {sub && !sub.isLate && <Badge tone="brand">Submitted</Badge>}
                      <Badge tone={past ? "neutral" : "brand"} emphasis="outline">
                        {past ? "Closed" : "Open"}
                      </Badge>
                    </>
                  }
                />
                <CardBody className="space-y-4">
                  {sub ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-elevated px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="eyebrow">On file</p>
                        <a
                          className="mt-0.5 flex items-center gap-1.5 text-sm text-brand hover:underline"
                          href={`/api/submissions/${sub.id}/download`}
                        >
                          <Download className="size-3.5 shrink-0" aria-hidden />
                          <span className="record">{sub.fileName}</span>
                        </a>
                      </div>
                      <p className="text-xs text-ink-faint">
                        Uploaded {formatDateTime(sub.submittedAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-muted">
                      Nothing submitted yet.
                    </p>
                  )}

                  {canSubmit ? (
                    <ActionForm
                      action={submitAssessment}
                      submitLabel={sub ? "Replace file" : "Submit work"}
                      pendingLabel="Uploading…"
                      successMessage={sub ? "File replaced" : "Work submitted"}
                    >
                      <input type="hidden" name="assessmentId" value={a.id} />
                      <Field
                        label="Your file"
                        htmlFor={`file-${a.id}`}
                        hint="PDF or DOCX, 10 MB maximum."
                        className="max-w-md"
                      >
                        <Input
                          id={`file-${a.id}`}
                          name="file"
                          type="file"
                          accept={ACCEPTED_FILES}
                          required
                        />
                      </Field>
                    </ActionForm>
                  ) : (
                    <p className="text-sm text-ink-muted">
                      The deadline has passed, so this file can no longer be
                      replaced. Your late submission is on record.
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
