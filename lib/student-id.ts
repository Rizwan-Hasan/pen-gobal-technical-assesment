import { prisma } from "@/lib/prisma";

export async function generateStudentId(year = new Date().getFullYear()) {
  const prefix = `SMS-${year}-`;

  return prisma.$transaction(async (tx) => {
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
  });
}
