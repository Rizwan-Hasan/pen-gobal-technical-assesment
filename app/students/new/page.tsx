import { redirect } from "next/navigation";
import { EnrolmentStatus } from "@prisma/client";
import { createStudent } from "@/app/actions/students";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";

export const metadata = { title: "Enrol student" };

export default async function NewStudentPage() {
  await requireStaff();
  const programmes = await prisma.programme.findMany({ orderBy: { code: "asc" } });

  async function action(formData: FormData) {
    "use server";
    const result = await createStudent(formData);
    if (result.ok && result.id) redirect(`/students/${result.id}`);
    return result;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Registry · New record"
        title="Enrol a student"
        description="The student ID is generated on save, and the fee is copied from the programme's current default."
      />

      <Card>
        <CardBody>
          <ActionForm
            action={action}
            submitLabel="Enrol student"
            pendingLabel="Enrolling…"
            successMessage="Student enrolled"
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Full name" htmlFor="fullName" className="sm:col-span-2">
              <Input id="fullName" name="fullName" required autoComplete="off" />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" required />
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth">
              <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
            </Field>
            <Field label="Programme" htmlFor="programmeId" className="sm:col-span-2">
              <Select id="programmeId" name="programmeId" required defaultValue="">
                <option value="" disabled>
                  Choose a programme
                </option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Academic year"
              htmlFor="academicYear"
              hint="Format: 2025/26. The fee due date is derived from it."
            >
              <Input
                id="academicYear"
                name="academicYear"
                placeholder="2025/26"
                required
              />
            </Field>
            <Field label="Enrolment status" htmlFor="status">
              <Select id="status" name="status" defaultValue={EnrolmentStatus.ENROLLED}>
                {Object.values(EnrolmentStatus).map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
