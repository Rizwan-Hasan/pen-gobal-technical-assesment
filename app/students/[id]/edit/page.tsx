import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EnrolmentStatus } from "@prisma/client";
import { updateStudent } from "@/app/actions/students";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toNumber } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();
  const programmes = await prisma.programme.findMany({ orderBy: { code: "asc" } });

  async function action(formData: FormData) {
    "use server";
    const result = await updateStudent(formData);
    if (result.ok) redirect(`/students/${id}`);
    return result;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow={`${student.studentId} · cannot be changed`}
        title="Edit record"
        description={student.fullName}
        actions={
          <Link href={`/students/${student.id}`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      <Card>
        <CardBody>
          <ActionForm
            action={action}
            submitLabel="Save changes"
            successMessage="Changes saved"
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={student.id} />
            <Field label="Full name" htmlFor="fullName" className="sm:col-span-2">
              <Input
                id="fullName"
                name="fullName"
                defaultValue={student.fullName}
                required
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={student.email}
                required
              />
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth">
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={student.dateOfBirth.toISOString().slice(0, 10)}
                required
              />
            </Field>
            <Field label="Programme" htmlFor="programmeId" className="sm:col-span-2">
              <Select
                id="programmeId"
                name="programmeId"
                defaultValue={student.programmeId}
              >
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Academic year" htmlFor="academicYear">
              <Input
                id="academicYear"
                name="academicYear"
                defaultValue={student.academicYear}
                required
              />
            </Field>
            <Field label="Enrolment status" htmlFor="status">
              <Select id="status" name="status" defaultValue={student.status}>
                {Object.values(EnrolmentStatus).map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Fee"
              htmlFor="feeAmount"
              className="sm:col-span-2"
              hint="Snapshotted at enrolment. Changing it does not affect other students on the programme."
            >
              <Input
                id="feeAmount"
                name="feeAmount"
                type="number"
                step="0.01"
                defaultValue={toNumber(student.feeAmount)}
              />
            </Field>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
