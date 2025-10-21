-- CreateEnum
CREATE TYPE "public"."TipoPredicao" AS ENUM ('DESEMPENHO', 'EVASAO');

-- AlterTable
ALTER TABLE "public"."matriculas" ADD COLUMN     "Nota" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."predictions" (
    "IDPrediction" TEXT NOT NULL,
    "IDMatricula" TEXT NOT NULL,
    "TipoPredicao" "public"."TipoPredicao" NOT NULL,
    "Probabilidade" DOUBLE PRECISION NOT NULL,
    "Classificacao" TEXT NOT NULL,
    "Explicacao" TEXT,
    "DadosEntrada" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("IDPrediction")
);

-- AddForeignKey
ALTER TABLE "public"."predictions" ADD CONSTRAINT "predictions_IDMatricula_fkey" FOREIGN KEY ("IDMatricula") REFERENCES "public"."matriculas"("IDMatricula") ON DELETE CASCADE ON UPDATE CASCADE;
