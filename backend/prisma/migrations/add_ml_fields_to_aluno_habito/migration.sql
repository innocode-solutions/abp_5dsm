-- AlterTable: Adiciona novos campos para integração com ML
-- Esta migração altera a tabela aluno_habitos para incluir campos de evasão e desempenho

-- Primeiro, altera os campos existentes para serem opcionais e mudar tipos
ALTER TABLE "aluno_habitos" 
  ALTER COLUMN "horasEstudo" DROP NOT NULL,
  ALTER COLUMN "sono" DROP NOT NULL,
  ALTER COLUMN "motivacao" DROP NOT NULL,
  ALTER COLUMN "frequencia" DROP NOT NULL;

-- Converte tipos Int para Float para campos numéricos
ALTER TABLE "aluno_habitos" 
  ALTER COLUMN "horasEstudo" TYPE DOUBLE PRECISION USING "horasEstudo"::DOUBLE PRECISION,
  ALTER COLUMN "sono" TYPE DOUBLE PRECISION USING "sono"::DOUBLE PRECISION,
  ALTER COLUMN "frequencia" TYPE DOUBLE PRECISION USING "frequencia"::DOUBLE PRECISION;

-- Adiciona campos para predição de EVASÃO
ALTER TABLE "aluno_habitos" 
  ADD COLUMN IF NOT EXISTS "raisedhands" INTEGER,
  ADD COLUMN IF NOT EXISTS "VisITedResources" INTEGER,
  ADD COLUMN IF NOT EXISTS "AnnouncementsView" INTEGER,
  ADD COLUMN IF NOT EXISTS "Discussion" INTEGER,
  ADD COLUMN IF NOT EXISTS "ParentAnsweringSurvey" TEXT,
  ADD COLUMN IF NOT EXISTS "ParentschoolSatisfaction" TEXT,
  ADD COLUMN IF NOT EXISTS "StudentAbsenceDays" TEXT;

-- Adiciona campos para predição de DESEMPENHO
ALTER TABLE "aluno_habitos" 
  ADD COLUMN IF NOT EXISTS "Previous_Scores" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "Distance_from_Home" TEXT,
  ADD COLUMN IF NOT EXISTS "Gender" TEXT,
  ADD COLUMN IF NOT EXISTS "Parental_Education_Level" TEXT,
  ADD COLUMN IF NOT EXISTS "Parental_Involvement" TEXT,
  ADD COLUMN IF NOT EXISTS "School_Type" TEXT,
  ADD COLUMN IF NOT EXISTS "Peer_Influence" TEXT,
  ADD COLUMN IF NOT EXISTS "Extracurricular_Activities" TEXT,
  ADD COLUMN IF NOT EXISTS "Learning_Disabilities" TEXT,
  ADD COLUMN IF NOT EXISTS "Internet_Access" TEXT,
  ADD COLUMN IF NOT EXISTS "Access_to_Resources" TEXT,
  ADD COLUMN IF NOT EXISTS "Teacher_Quality" TEXT,
  ADD COLUMN IF NOT EXISTS "Family_Income" TEXT,
  ADD COLUMN IF NOT EXISTS "Motivation_Level" TEXT,
  ADD COLUMN IF NOT EXISTS "Tutoring_Sessions" TEXT,
  ADD COLUMN IF NOT EXISTS "Physical_Activity" TEXT;

