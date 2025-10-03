-- CreateEnum
CREATE TYPE "public"."StatusMatricula" AS ENUM ('ENROLLED', 'DROPPED', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."cursos" (
    "IDCurso" TEXT NOT NULL,
    "NomeDoCurso" TEXT NOT NULL,
    "Descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("IDCurso")
);

-- CreateTable
CREATE TABLE "public"."disciplinas" (
    "IDDisciplina" TEXT NOT NULL,
    "IDCurso" TEXT NOT NULL,
    "NomeDaDisciplina" TEXT NOT NULL,
    "CodigoDaDisciplina" TEXT,
    "Ativa" BOOLEAN NOT NULL DEFAULT true,
    "CargaHoraria" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("IDDisciplina")
);

-- CreateTable
CREATE TABLE "public"."alunos" (
    "IDAluno" TEXT NOT NULL,
    "Nome" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Idade" INTEGER,
    "IDCurso" TEXT NOT NULL,
    "Semestre" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("IDAluno")
);

-- CreateTable
CREATE TABLE "public"."periodos_letivos" (
    "IDPeriodo" TEXT NOT NULL,
    "Nome" TEXT NOT NULL,
    "DataInicio" TIMESTAMP(3) NOT NULL,
    "DataFim" TIMESTAMP(3) NOT NULL,
    "Ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodos_letivos_pkey" PRIMARY KEY ("IDPeriodo")
);

-- CreateTable
CREATE TABLE "public"."matriculas" (
    "IDMatricula" TEXT NOT NULL,
    "IDAluno" TEXT NOT NULL,
    "IDDisciplina" TEXT NOT NULL,
    "IDPeriodo" TEXT NOT NULL,
    "Status" "public"."StatusMatricula" NOT NULL DEFAULT 'ENROLLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("IDMatricula")
);

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_IDCurso_CodigoDaDisciplina_key" ON "public"."disciplinas"("IDCurso", "CodigoDaDisciplina");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_Email_key" ON "public"."alunos"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_IDAluno_IDDisciplina_IDPeriodo_key" ON "public"."matriculas"("IDAluno", "IDDisciplina", "IDPeriodo");

-- AddForeignKey
ALTER TABLE "public"."disciplinas" ADD CONSTRAINT "disciplinas_IDCurso_fkey" FOREIGN KEY ("IDCurso") REFERENCES "public"."cursos"("IDCurso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alunos" ADD CONSTRAINT "alunos_IDCurso_fkey" FOREIGN KEY ("IDCurso") REFERENCES "public"."cursos"("IDCurso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matriculas" ADD CONSTRAINT "matriculas_IDAluno_fkey" FOREIGN KEY ("IDAluno") REFERENCES "public"."alunos"("IDAluno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matriculas" ADD CONSTRAINT "matriculas_IDDisciplina_fkey" FOREIGN KEY ("IDDisciplina") REFERENCES "public"."disciplinas"("IDDisciplina") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matriculas" ADD CONSTRAINT "matriculas_IDPeriodo_fkey" FOREIGN KEY ("IDPeriodo") REFERENCES "public"."periodos_letivos"("IDPeriodo") ON DELETE CASCADE ON UPDATE CASCADE;
