import { createProgramme, updateProgrammeFee } from "@/app/actions/payments";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { toNumber } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Programmes" };

export default async function ProgrammesPage() {
  await requireStaff();
  const programmes = await prisma.programme.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { students: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Programmes"
        description="The default fee is copied onto a student when they enrol. Changing it here leaves existing records untouched."
      />

      {programmes.length === 0 ? (
        <Card>
          <EmptyState
            title="No programmes yet"
            description="Add the first programme below — students cannot be enrolled without one."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programmes.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader
                title={p.name}
                description={
                  <span className="record">
                    {p.code} · {p._count.students}{" "}
                    {p._count.students === 1 ? "student" : "students"}
                  </span>
                }
                action={
                  <span className="tabular text-lg font-semibold">
                    {formatMoney(toNumber(p.defaultFee))}
                  </span>
                }
              />
              <CardFooter className="mt-auto">
                <ActionForm
                  action={updateProgrammeFee}
                  submitLabel="Update fee"
                  successMessage="Fee updated"
                  size="sm"
                  variant="secondary"
                  layout="inline"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <Field label="Default fee" htmlFor={`fee-${p.id}`}>
                    <Input
                      id={`fee-${p.id}`}
                      name="defaultFee"
                      type="number"
                      step="0.01"
                      className="h-8 w-32 text-sm"
                      defaultValue={toNumber(p.defaultFee)}
                    />
                  </Field>
                </ActionForm>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title="Add a programme"
          description="Codes are used throughout the register, so keep them short."
        />
        <CardBody>
          <ActionForm
            action={async (formData: FormData) => {
              'use server';
              return createProgramme(formData);
            }}
            submitLabel="Add programme"
            successMessage="Programme added"
            className="grid gap-4 sm:grid-cols-3"
          >
            <Field label="Code" htmlFor="code">
              <Input id="code" name="code" required placeholder="BSC-CS" />
            </Field>
            <Field label="Name" htmlFor="name">
              <Input
                id="name"
                name="name"
                required
                placeholder="BSc Computer Science"
              />
            </Field>
            <Field label="Default fee" htmlFor="defaultFee">
              <Input
                id="defaultFee"
                name="defaultFee"
                type="number"
                step="0.01"
                required
              />
            </Field>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
