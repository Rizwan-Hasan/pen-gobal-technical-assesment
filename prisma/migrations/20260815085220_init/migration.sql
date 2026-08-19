-- CreateEnum
CREATE TYPE "EnrolmentStatus" AS ENUM ('ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STAFF', 'STUDENT');

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultFee" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" "EnrolmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "feeAmount" DECIMAL(10,2) NOT NULL,
    "feeDueDate" TIMESTAMP(3) NOT NULL,
    "programmeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "linkedStudentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Programme_code_key" ON "Programme"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");

-- CreateIndex
CREATE INDEX "Student_studentId_idx" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "Student_programmeId_idx" ON "Student"("programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "Submission"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assessmentId_studentId_key" ON "Submission"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "Result_studentId_idx" ON "Result"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_assessmentId_studentId_key" ON "Result"("assessmentId", "studentId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_linkedStudentId_fkey" FOREIGN KEY ("linkedStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
