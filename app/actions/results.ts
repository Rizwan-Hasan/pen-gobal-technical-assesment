"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";
import { gradeSchema } from "@/lib/validations";
import type { ActionResult } from "@/app/actions/students";

export async function saveGrade(formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const parsed = gradeSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
    studentId: formData.get("studentId"),
    grade: formData.get("grade"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid grade" };
  }

  const { assessmentId, studentId, grade } = parsed.data;
  await prisma.result.upsert({
    where: {
      assessmentId_studentId: { assessmentId, studentId },
    },
    create: { assessmentId, studentId, grade, publishedAt: null },
    update: { grade },
  });

  revalidatePath(`/assessments/${assessmentId}/marksheet`);
  revalidatePath("/student/marksheet");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setResultPublished(
  assessmentId: string,
  studentId: string,
  publish: boolean,
): Promise<ActionResult> {
  await requireStaff();

  const result = await prisma.result.findUnique({
    where: { assessmentId_studentId: { assessmentId, studentId } },
  });
  if (!result) {
    return { ok: false, error: "Enter a grade before publishing" };
  }

  await prisma.result.update({
    where: { id: result.id },
    data: { publishedAt: publish ? new Date() : null },
  });

  revalidatePath(`/assessments/${assessmentId}/marksheet`);
  revalidatePath("/student/marksheet");
  revalidatePath("/dashboard");
  return { ok: true };
}
