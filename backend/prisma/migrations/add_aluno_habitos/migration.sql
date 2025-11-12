-- CreateTable
CREATE TABLE "aluno_habitos" (
    "IDHabito" TEXT NOT NULL,
    "IDAluno" TEXT NOT NULL,
    "horasEstudo" INTEGER NOT NULL,
    "sono" INTEGER NOT NULL,
    "motivacao" INTEGER NOT NULL,
    "frequencia" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aluno_habitos_pkey" PRIMARY KEY ("IDHabito")
);

-- AddForeignKey
ALTER TABLE "aluno_habitos" ADD CONSTRAINT "aluno_habitos_IDAluno_fkey" FOREIGN KEY ("IDAluno") REFERENCES "alunos"("IDAluno") ON DELETE CASCADE ON UPDATE CASCADE;