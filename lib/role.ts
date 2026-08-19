import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ROLE_COOKIE = "sms_role";
export const STUDENT_COOKIE = "sms_student_id";

export type SessionContext = {
  role: UserRole;
  actingStudentId: string | null;
  actingStudent: {
    id: string;
    studentId: string;
    fullName: string;
    email: string;
  } | null;
};

export async function getSession(): Promise<SessionContext> {
  const jar = await cookies();
  const roleRaw = jar.get(ROLE_COOKIE)?.value;
  const role: UserRole = roleRaw === "STUDENT" ? "STUDENT" : "STAFF";
  const actingStudentId = jar.get(STUDENT_COOKIE)?.value ?? null;

  if (role !== "STUDENT") {
    return { role, actingStudentId: null, actingStudent: null };
  }

  let student = actingStudentId
    ? await prisma.student.findUnique({
        where: { id: actingStudentId },
        select: { id: true, studentId: true, fullName: true, email: true },
      })
    : null;

  if (!student) {
    student = await prisma.student.findFirst({
      orderBy: { studentId: "asc" },
      select: { id: true, studentId: true, fullName: true, email: true },
    });
  }

  return {
    role,
    actingStudentId: student?.id ?? null,
    actingStudent: student,
  };
}

export async function requireStaff() {
  const session = await getSession();
  if (session.role !== "STAFF") {
    redirect("/student");
  }
  return session;
}

export async function requireStudent() {
  const session = await getSession();
  if (session.role !== "STUDENT" || !session.actingStudent) {
    redirect("/dashboard");
  }
  return session;
}
