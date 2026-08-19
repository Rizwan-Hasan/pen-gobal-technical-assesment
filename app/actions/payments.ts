"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/role";
import { outstandingBalance, toNumber } from "@/lib/fees";
import { paymentSchema, programmeSchema } from "@/lib/validations";
import { formatMoney } from "@/lib/utils";
import type { ActionResult } from "@/app/actions/students";

export async function recordPayment(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const parsed = paymentSchema.safeParse({
    studentId: formData.get("studentId"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    reference: formData.get("reference"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { studentId, amount, paidAt, reference } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: studentId },
        include: { payments: true },
      });
      if (!student) throw new Error("Student not found");

      const outstanding = outstandingBalance(student.feeAmount, student.payments);
      if (amount > outstanding + 0.001) {
        throw new Error(
          `Payment exceeds outstanding balance (${formatMoney(outstanding)})`,
        );
      }

      await tx.payment.create({
        data: {
          studentId,
          amount,
          paidAt: new Date(paidAt),
          reference: reference.trim(),
        },
      });
    });

    revalidatePath(`/students/${studentId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Payment reference must be unique" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Payment failed" };
  }
}

export async function updateProgrammeFee(formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const defaultFee = Number(formData.get("defaultFee"));
  if (!id || !Number.isFinite(defaultFee) || defaultFee <= 0) {
    return { ok: false, error: "Valid fee required" };
  }
  await prisma.programme.update({
    where: { id },
    data: { defaultFee },
  });
  revalidatePath("/programmes");
  return { ok: true, id };
}

export async function createProgramme(formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const parsed = programmeSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    defaultFee: formData.get("defaultFee"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const p = await prisma.programme.create({ data: parsed.data });
    revalidatePath("/programmes");
    return { ok: true, id: p.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Programme code already exists" };
    }
    return { ok: false, error: "Failed to create programme" };
  }
}

export { toNumber };
