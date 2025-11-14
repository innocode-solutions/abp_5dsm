// alunoHabitoSchemas.ts
// Schemas de validação para hábitos de estudo do aluno

import { z } from 'zod';

// Enums para validação
const BinaryChoice = z.enum(['Yes', 'No']);
const SatisfactionLevel = z.enum(['Good', 'Bad']);
const AbsenceDays = z.enum(['Under-7', 'Above-7']);
const GenderEnum = z.enum(['Male', 'Female']);
const Level = z.enum(['Low', 'Medium', 'High']);
const Distance = z.enum(['Near', 'Far']);
const EducationLevel = z.enum(['None', 'High School', 'Some College', "Bachelor's", "Master's"]);
const SchoolType = z.enum(['Public', 'Private']);
const PeerInfluence = z.enum(['Positive', 'Negative', 'Neutral']);
const ResourceAccess = z.enum(['Poor', 'Average', 'Good']);

// Schema para campos básicos de hábitos (compatibilidade com versão anterior)
export const AlunoHabitoBasicoSchema = z.object({
  horasEstudo: z.number().min(0).max(12, 'Horas de estudo deve ser entre 0 e 12'),
  sono: z.number().min(0).max(12, 'Horas de sono deve ser entre 0 e 12'),
  motivacao: z.number().int().min(0).max(10, 'Motivação deve ser entre 0 e 10'),
  frequencia: z.number().min(0).max(100, 'Frequência deve ser entre 0 e 100'),
});

// Schema completo para predição de EVASÃO
export const AlunoHabitoEvasaoSchema = z.object({
  // Campos básicos
  horasEstudo: z.number().min(0).max(12).optional(),
  sono: z.number().min(0).max(12).optional(),
  motivacao: z.number().int().min(0).max(10).optional(),
  frequencia: z.number().min(0).max(100).optional(),
  
  // Campos específicos para evasão
  raisedhands: z.number().int().min(0, 'Mãos levantadas deve ser >= 0'),
  VisITedResources: z.number().int().min(0, 'Recursos visitados deve ser >= 0'),
  AnnouncementsView: z.number().int().min(0, 'Visualizações de avisos deve ser >= 0'),
  Discussion: z.number().int().min(0, 'Discussões deve ser >= 0'),
  ParentAnsweringSurvey: BinaryChoice,
  ParentschoolSatisfaction: SatisfactionLevel,
  StudentAbsenceDays: AbsenceDays,
});

// Schema completo para predição de DESEMPENHO
export const AlunoHabitoDesempenhoSchema = z.object({
  // Campos básicos
  horasEstudo: z.number().min(0).max(12),
  sono: z.number().min(0).max(12),
  motivacao: z.number().int().min(0).max(10).optional(),
  frequencia: z.number().min(0).max(100),
  
  // Campos específicos para desempenho
  Previous_Scores: z.number().min(0).max(100, 'Notas anteriores deve ser entre 0 e 100'),
  Distance_from_Home: Distance,
  Gender: GenderEnum,
  Parental_Education_Level: EducationLevel,
  Parental_Involvement: Level,
  School_Type: SchoolType,
  Peer_Influence: PeerInfluence,
  Extracurricular_Activities: BinaryChoice,
  Learning_Disabilities: BinaryChoice,
  Internet_Access: BinaryChoice,
  Access_to_Resources: ResourceAccess,
  Teacher_Quality: ResourceAccess,
  Family_Income: Level,
  Motivation_Level: Level,
  Tutoring_Sessions: BinaryChoice,
  Physical_Activity: Level,
});

// Schema completo que combina todos os campos (para salvar no banco)
export const AlunoHabitoCompletoSchema = z.object({
  // Campos básicos
  horasEstudo: z.number().min(0).max(12).optional(),
  sono: z.number().min(0).max(12).optional(),
  motivacao: z.number().int().min(0).max(10).optional(),
  frequencia: z.number().min(0).max(100).optional(),
  
  // Campos para evasão
  raisedhands: z.number().int().min(0).optional(),
  VisITedResources: z.number().int().min(0).optional(),
  AnnouncementsView: z.number().int().min(0).optional(),
  Discussion: z.number().int().min(0).optional(),
  ParentAnsweringSurvey: BinaryChoice.optional(),
  ParentschoolSatisfaction: SatisfactionLevel.optional(),
  StudentAbsenceDays: AbsenceDays.optional(),
  
  // Campos para desempenho
  Previous_Scores: z.number().min(0).max(100).optional(),
  Distance_from_Home: Distance.optional(),
  Gender: GenderEnum.optional(),
  Parental_Education_Level: EducationLevel.optional(),
  Parental_Involvement: Level.optional(),
  School_Type: SchoolType.optional(),
  Peer_Influence: PeerInfluence.optional(),
  Extracurricular_Activities: BinaryChoice.optional(),
  Learning_Disabilities: BinaryChoice.optional(),
  Internet_Access: BinaryChoice.optional(),
  Access_to_Resources: ResourceAccess.optional(),
  Teacher_Quality: ResourceAccess.optional(),
  Family_Income: Level.optional(),
  Motivation_Level: Level.optional(),
  Tutoring_Sessions: BinaryChoice.optional(),
  Physical_Activity: Level.optional(),
});

// Schema para dados de engajamento (evasão) - campos mínimos obrigatórios
export const EngajamentoEvasaoSchema = z.object({
  raisedhands: z.number().int().min(0),
  VisITedResources: z.number().int().min(0),
  AnnouncementsView: z.number().int().min(0),
  Discussion: z.number().int().min(0),
  ParentAnsweringSurvey: BinaryChoice,
  ParentschoolSatisfaction: SatisfactionLevel,
  StudentAbsenceDays: AbsenceDays,
});

// Exportar tipos TypeScript
export type AlunoHabitoBasico = z.infer<typeof AlunoHabitoBasicoSchema>;
export type AlunoHabitoEvasao = z.infer<typeof AlunoHabitoEvasaoSchema>;
export type AlunoHabitoDesempenho = z.infer<typeof AlunoHabitoDesempenhoSchema>;
export type AlunoHabitoCompleto = z.infer<typeof AlunoHabitoCompletoSchema>;
export type EngajamentoEvasao = z.infer<typeof EngajamentoEvasaoSchema>;

