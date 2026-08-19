import "dotenv/config";
import { EnrolmentStatus, UserRole } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.result.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programme.deleteMany();

  const bsc = await prisma.programme.create({
    data: { code: "BSC-CS", name: "BSc Computer Science", defaultFee: 9000 },
  });
  const mba = await prisma.programme.create({
    data: { code: "MBA", name: "MBA (Full-time)", defaultFee: 12000 },
  });

  const year = new Date().getFullYear();
  const students = await Promise.all([
    prisma.student.create({
      data: {
        studentId: `SMS-${year}-0001`,
        fullName: "Amina Rahman",
        email: "amina.rahman@example.com",
        dateOfBirth: new Date("2002-03-14"),
        academicYear: "2025/26",
        status: EnrolmentStatus.ENROLLED,
        programmeId: bsc.id,
        feeAmount: 9000,
        feeDueDate: new Date("2025-08-01"),
      },
    }),
    prisma.student.create({
      data: {
        studentId: `SMS-${year}-0002`,
        fullName: "Ben Carter",
        email: "ben.carter@example.com",
        dateOfBirth: new Date("2001-11-02"),
        academicYear: "2025/26",
        status: EnrolmentStatus.ENROLLED,
        programmeId: bsc.id,
        feeAmount: 9000,
        feeDueDate: new Date("2025-08-01"),
      },
    }),
    prisma.student.create({
      data: {
        studentId: `SMS-${year}-0003`,
        fullName: "Chen Wei",
        email: "chen.wei@example.com",
        dateOfBirth: new Date("1998-07-22"),
        academicYear: "2025/26",
        status: EnrolmentStatus.DEFERRED,
        programmeId: mba.id,
        feeAmount: 12000,
        feeDueDate: new Date("2025-08-01"),
      },
    }),
    prisma.student.create({
      data: {
        studentId: `SMS-${year}-0004`,
        fullName: "Diego Alvarez",
        email: "diego.alvarez@example.com",
        dateOfBirth: new Date("2000-01-09"),
        academicYear: "2024/25",
        status: EnrolmentStatus.WITHDRAWN,
        programmeId: mba.id,
        feeAmount: 12000,
        feeDueDate: new Date("2024-12-01"),
      },
    }),
    prisma.student.create({
      data: {
        studentId: `SMS-${year}-0005`,
        fullName: "Elena Popov",
        email: "elena.popov@example.com",
        dateOfBirth: new Date("1999-05-30"),
        academicYear: "2024/25",
        status: EnrolmentStatus.COMPLETED,
        programmeId: bsc.id,
        feeAmount: 9000,
        feeDueDate: new Date("2024-12-01"),
      },
    }),
  ]);

  await prisma.payment.createMany({
    data: [
      {
        studentId: students[0].id,
        amount: 4500,
        paidAt: new Date("2025-09-15"),
        reference: "PAY-AMINA-001",
      },
      {
        studentId: students[1].id,
        amount: 9000,
        paidAt: new Date("2025-09-10"),
        reference: "PAY-BEN-001",
      },
      {
        studentId: students[4].id,
        amount: 9000,
        paidAt: new Date("2024-10-01"),
        reference: "PAY-ELENA-001",
      },
      {
        studentId: students[3].id,
        amount: 3000,
        paidAt: new Date("2024-11-01"),
        reference: "PAY-DIEGO-001",
      },
    ],
  });

  const open = await prisma.assessment.create({
    data: {
      title: "Web Systems Coursework",
      module: "CS301",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  const past = await prisma.assessment.create({
    data: {
      title: "Databases Exam",
      module: "CS210",
      deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const latePath = path.join("uploads", "seed-late.pdf");
  const onTimePath = path.join("uploads", "seed-ontime.pdf");
  await writeFile(path.join(process.cwd(), latePath), Buffer.from("%PDF-1.4 seed late\n"));
  await writeFile(path.join(process.cwd(), onTimePath), Buffer.from("%PDF-1.4 seed ontime\n"));

  await prisma.submission.create({
    data: {
      assessmentId: past.id,
      studentId: students[0].id,
      fileName: "amina-db.pdf",
      filePath: latePath,
      mimeType: "application/pdf",
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isLate: true,
    },
  });
  await prisma.submission.create({
    data: {
      assessmentId: past.id,
      studentId: students[1].id,
      fileName: "ben-db.pdf",
      filePath: onTimePath,
      mimeType: "application/pdf",
      submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      isLate: false,
    },
  });

  await prisma.result.createMany({
    data: [
      {
        assessmentId: past.id,
        studentId: students[0].id,
        grade: 72,
        publishedAt: new Date(),
      },
      {
        assessmentId: past.id,
        studentId: students[1].id,
        grade: 58,
        publishedAt: null,
      },
      {
        assessmentId: past.id,
        studentId: students[4].id,
        grade: 35,
        publishedAt: new Date(),
      },
      {
        assessmentId: open.id,
        studentId: students[0].id,
        grade: 65,
        publishedAt: null,
      },
    ],
  });

  await prisma.user.createMany({
    data: [
      { name: "Registry Staff", role: UserRole.STAFF },
      {
        name: "Amina Rahman",
        role: UserRole.STUDENT,
        linkedStudentId: students[0].id,
      },
    ],
  });

  console.log("Seed complete:", {
    programmes: 2,
    students: students.length,
    assessments: 2,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
