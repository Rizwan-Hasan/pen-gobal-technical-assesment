"use server";

import { revalidatePath } from "next/cache";
import { EnrolmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";
import { feeDueDateFromAcademicYear } from "@/lib/fees";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/validations";

async function nextStudentId(
  tx: Prisma.TransactionClient,
  year = new Date().getFullYear(),
) {
  const prefix = `SMS-${year}-`;
  const latest = await tx.student.findFirst({
    where: { studentId: { startsWith: prefix } },
    orderBy: { studentId: "desc" },
    select: { studentId: true },
  });
  let next = 1;
  if (latest) {
    const seq = Number(latest.studentId.slice(prefix.length));
    if (Number.isFinite(seq)) next = seq + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function createStudent(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const parsed = studentCreateSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    dateOfBirth: formData.get("dateOfBirth"),
    programmeId: formData.get("programmeId"),
    academicYear: formData.get("academicYear"),
    status: formData.get("status") || EnrolmentStatus.ENROLLED,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const dob = new Date(data.dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob >= new Date()) {
    return { ok: false, error: "Date of birth must be a valid past date" };
  }

  try {
    const student = await prisma.$transaction(async (tx) => {
      const programme = await tx.programme.findUnique({
        where: { id: data.programmeId },
      });
      if (!programme) throw new Error("Programme not found");

      const studentId = await nextStudentId(tx);
      return tx.student.create({
        data: {
          studentId,
          fullName: data.fullName,
          email: data.email.toLowerCase(),
          dateOfBirth: dob,
          academicYear: data.academicYear,
          status: data.status,
          programmeId: programme.id,
          feeAmount: programme.defaultFee,
          feeDueDate: feeDueDateFromAcademicYear(data.academicYear),
        },
      });
    });

    revalidatePath("/students");
    revalidatePath("/dashboard");
    return { ok: true, id: student.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "A student with this email already exists" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create student" };
  }
}

export async function updateStudent(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const parsed = studentUpdateSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName") || undefined,
    email: formData.get("email") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    programmeId: formData.get("programmeId") || undefined,
    academicYear: formData.get("academicYear") || undefined,
    status: formData.get("status") || undefined,
    feeAmount: formData.get("feeAmount") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, ...rest } = parsed.data;

  try {
    await prisma.student.update({
      where: { id },
      data: {
        ...(rest.fullName ? { fullName: rest.fullName } : {}),
        ...(rest.email ? { email: rest.email.toLowerCase() } : {}),
        ...(rest.dateOfBirth ? { dateOfBirth: new Date(rest.dateOfBirth) } : {}),
        ...(rest.programmeId ? { programmeId: rest.programmeId } : {}),
        ...(rest.academicYear ? { academicYear: rest.academicYear } : {}),
        ...(rest.status ? { status: rest.status } : {}),
        ...(rest.feeAmount !== undefined ? { feeAmount: rest.feeAmount } : {}),
      },
    });
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "A student with this email already exists" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update student" };
  }
}
