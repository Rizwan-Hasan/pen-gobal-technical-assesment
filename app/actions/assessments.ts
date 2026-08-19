"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireStudent } from "@/lib/role";
import { assessmentSchema } from "@/lib/validations";
import type { ActionResult } from "@/app/actions/students";

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function createAssessment(formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const parsed = assessmentSchema.safeParse({
    title: formData.get("title"),
    module: formData.get("module"),
    deadline: formData.get("deadline"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const a = await prisma.assessment.create({
    data: {
      title: parsed.data.title,
      module: parsed.data.module,
      deadline: new Date(parsed.data.deadline),
    },
  });
  revalidatePath("/assessments");
  revalidatePath("/student/assessments");
  return { ok: true, id: a.id };
}

export async function submitAssessment(formData: FormData): Promise<ActionResult> {
  const session = await requireStudent();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const file = formData.get("file");

  if (!assessmentId || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Assessment and file are required" };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Only PDF or DOCX files are allowed" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 10 MB or smaller" };
  }

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) return { ok: false, error: "Assessment not found" };

  const now = new Date();
  const isLate = now > assessment.deadline;
  const existing = await prisma.submission.findUnique({
    where: {
      assessmentId_studentId: {
        assessmentId,
        studentId: session.actingStudent!.id,
      },
    },
  });

  if (existing && now > assessment.deadline) {
    return {
      ok: false,
      error: "Resubmission is only allowed before the deadline",
    };
  }

  const ext =
    file.type === "application/pdf"
      ? ".pdf"
      : ".docx";
  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const storedName = `${randomUUID()}${ext}`;
  const filePath = path.join(uploadsDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  if (existing) {
    try {
      await unlink(path.join(process.cwd(), existing.filePath));
    } catch {
      /* ignore missing old file */
    }
    await prisma.submission.update({
      where: { id: existing.id },
      data: {
        fileName: file.name,
        filePath: path.join("uploads", storedName),
        mimeType: file.type,
        submittedAt: now,
        isLate,
      },
    });
  } else {
    await prisma.submission.create({
      data: {
        assessmentId,
        studentId: session.actingStudent!.id,
        fileName: file.name,
        filePath: path.join("uploads", storedName),
        mimeType: file.type,
        submittedAt: now,
        isLate,
      },
    });
  }

  revalidatePath("/student/assessments");
  revalidatePath(`/assessments/${assessmentId}`);
  return { ok: true };
}
