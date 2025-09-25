-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateTable
CREATE TABLE "public"."users" (
    "IDUser" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "Role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "name" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("IDUser")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_Email_key" ON "public"."users"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "public"."users"("studentId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."alunos"("IDAluno") ON DELETE SET NULL ON UPDATE CASCADE;
