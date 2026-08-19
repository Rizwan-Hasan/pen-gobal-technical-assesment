"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { ROLE_COOKIE, STUDENT_COOKIE } from "@/lib/role";

export async function switchToStaff() {
  const jar = await cookies();
  jar.set(ROLE_COOKIE, "STAFF" satisfies UserRole, { path: "/", sameSite: "lax" });
  redirect("/dashboard");
}

export async function switchToStudent() {
  const jar = await cookies();
  jar.set(ROLE_COOKIE, "STUDENT" satisfies UserRole, { path: "/", sameSite: "lax" });
  redirect("/student");
}

export async function setActingStudent(formData: FormData) {
  const jar = await cookies();
  const studentId = String(formData.get("studentId") ?? "");
  if (studentId) {
    jar.set(STUDENT_COOKIE, studentId, { path: "/", sameSite: "lax" });
  }
  redirect("/student");
}
