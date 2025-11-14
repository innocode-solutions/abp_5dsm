// predictionSchemas.ts

import { z } from 'zod';

// --- Definições de Enums Comuns (Baseadas no seu CSV) ---
const StudentAbsenceDaysEnum = z.enum(['Under-7', 'Above-7']);
const SurveyAnswer = z.enum(['Yes', 'No']);
const SchoolSatisfaction = z.enum(['Good', 'Bad']);
const GenderCSV = z.enum(['M', 'F']);
const SemesterType = z.enum(['F', 'S']);
const RelationType = z.enum(['Father', 'Mum']);


// 1. Schema para o Formulário Simplificado do ALUNO (7 campos que ele insere)
export const AlunoDadosEvasaoSchema = z.object({
    IDMatricula: z.string().uuid('IDMatricula é obrigatório e deve ser um UUID válido.'),
    raisedhands: z.number().int().min(0, 'Mãos levantadas deve ser >= 0.'),
    VisITedResources: z.number().int().min(0, 'Recursos visitados deve ser >= 0.'),
    AnnouncementsView: z.number().int().min(0, 'Visualizações de avisos deve ser >= 0.'),
    Discussion: z.number().int().min(0, 'Discussões deve ser >= 0.'),
    
    StudentAbsenceDays: StudentAbsenceDaysEnum,
    ParentAnsweringSurvey: SurveyAnswer,
    ParentschoolSatisfaction: SchoolSatisfaction,
});


// 2. Schema COMPLETO de 16 campos (Input REAL para o ML)
export const MLServiceSchema = z.object({
    gender: GenderCSV,
    NationalITy: z.string().min(1),
    PlaceofBirth: z.string().min(1),
    StageID: z.string().min(1),
    GradeID: z.string().min(1),
    SectionID: z.string().min(1),
    Topic: z.string().min(1),
    Semester: SemesterType,
    Relation: RelationType,
    
    raisedhands: z.number(),
    VisITedResources: z.number(),
    AnnouncementsView: z.number(),
    Discussion: z.number(),
    StudentAbsenceDays: StudentAbsenceDaysEnum,
    ParentAnsweringSurvey: SurveyAnswer,
    ParentschoolSatisfaction: SchoolSatisfaction,
});


// 3. Schema Original (Para a rota /generate - Professor/Admin)
// Mantido com a correção do Teste 9 (para evitar regressão, se usado)
export const generatePredictionSchema = z.object({
 IDMatricula: z.string().uuid('IDMatricula é obrigatório'),
 TipoPredicao: z.enum(['EVASAO', 'DESEMPENHO']),
 dados: z.record(z.string(), z.any()) // Usei z.record para manter flexibilidade se a rota for usada para DESEMPENHO
}).passthrough()