-- CreateTable
CREATE TABLE "professor_disciplina" (
    "IDProfessorDisciplina" TEXT NOT NULL,
    "IDUser" TEXT NOT NULL,
    "IDDisciplina" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professor_disciplina_pkey" PRIMARY KEY ("IDProfessorDisciplina")
);

-- CreateIndex
CREATE INDEX "idx_professor_disciplina_user" ON "professor_disciplina"("IDUser");

-- CreateIndex
CREATE INDEX "idx_professor_disciplina_disciplina" ON "professor_disciplina"("IDDisciplina");

-- CreateIndex
CREATE UNIQUE INDEX "professor_disciplina_IDUser_IDDisciplina_key" ON "professor_disciplina"("IDUser", "IDDisciplina");

-- AddForeignKey
ALTER TABLE "professor_disciplina" ADD CONSTRAINT "professor_disciplina_IDUser_fkey" FOREIGN KEY ("IDUser") REFERENCES "users"("IDUser") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor_disciplina" ADD CONSTRAINT "professor_disciplina_IDDisciplina_fkey" FOREIGN KEY ("IDDisciplina") REFERENCES "disciplinas"("IDDisciplina") ON DELETE CASCADE ON UPDATE CASCADE;

