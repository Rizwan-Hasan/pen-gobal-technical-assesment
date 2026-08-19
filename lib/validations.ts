import { z } from "zod";
import { EnrolmentStatus } from "@prisma/client";

export const studentCreateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Valid email required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  programmeId: z.string().min(1, "Programme is required"),
  academicYear: z
    .string()
    .regex(/^\d{4}\/\d{2}$/, "Use format YYYY/YY e.g. 2025/26"),
  status: z.nativeEnum(EnrolmentStatus).default(EnrolmentStatus.ENROLLED),
});

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  id: z.string().min(1),
  feeAmount: z.coerce.number().min(0).optional(),
});

export const paymentSchema = z.object({
  studentId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paidAt: z.string().min(1),
  reference: z.string().trim().min(3, "Reference required"),
});

export const assessmentSchema = z.object({
  title: z.string().trim().min(2),
  module: z.string().trim().min(2),
  deadline: z.string().min(1),
});

export const gradeSchema = z.object({
  assessmentId: z.string().min(1),
  studentId: z.string().min(1),
  grade: z.coerce.number().int().min(0).max(100),
});

export const programmeSchema = z.object({
  code: z.string().trim().min(2),
  name: z.string().trim().min(2),
  defaultFee: z.coerce.number().positive(),
});
