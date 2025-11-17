// habitoMapperService.ts
// Serviço para mapear dados de hábitos do aluno para o formato esperado pelo ML

import { AlunoHabito } from '@prisma/client';

// Tipo estendido para incluir os novos campos
type AlunoHabitoExtended = AlunoHabito & {
  raisedhands?: number | null;
  VisITedResources?: number | null;
  AnnouncementsView?: number | null;
  Discussion?: number | null;
  ParentAnsweringSurvey?: string | null;
  ParentschoolSatisfaction?: string | null;
  StudentAbsenceDays?: string | null;
  Previous_Scores?: number | null;
  Distance_from_Home?: string | null;
  Gender?: string | null;
  Parental_Education_Level?: string | null;
  Parental_Involvement?: string | null;
  School_Type?: string | null;
  Peer_Influence?: string | null;
  Extracurricular_Activities?: string | null;
  Learning_Disabilities?: string | null;
  Internet_Access?: string | null;
  Access_to_Resources?: string | null;
  Teacher_Quality?: string | null;
  Family_Income?: string | null;
  Motivation_Level?: string | null;
  Tutoring_Sessions?: string | null;
  Physical_Activity?: string | null;
};

/**
 * Converte dados de hábitos do aluno para o formato esperado pelo modelo de EVASÃO
 */
export function mapToDropoutData(habito: AlunoHabitoExtended) {
  if (!habito.raisedhands || !habito.VisITedResources || !habito.AnnouncementsView || 
      !habito.Discussion || !habito.ParentAnsweringSurvey || 
      !habito.ParentschoolSatisfaction || !habito.StudentAbsenceDays) {
    throw new Error('Campos obrigatórios para predição de evasão não estão preenchidos');
  }

  return {
    raisedhands: habito.raisedhands,
    VisITedResources: habito.VisITedResources,
    AnnouncementsView: habito.AnnouncementsView,
    Discussion: habito.Discussion,
    ParentAnsweringSurvey: habito.ParentAnsweringSurvey,
    ParentschoolSatisfaction: habito.ParentschoolSatisfaction,
    StudentAbsenceDays: habito.StudentAbsenceDays,
  };
}

/**
 * Converte motivacao (Int 0-10) para Motivation_Level (String: "Low"/"Medium"/"High")
 */
function convertMotivacaoToLevel(motivacao: number | null | undefined): string {
  if (motivacao === null || motivacao === undefined) return 'Medium'; // Default
  if (motivacao <= 3) return 'Low';
  if (motivacao <= 7) return 'Medium';
  return 'High';
}

/**
 * Converte dados de hábitos do aluno para o formato esperado pelo modelo de DESEMPENHO
 * EXIGE todos os campos obrigatórios para máxima precisão
 */
export function mapToPerformanceData(habito: AlunoHabitoExtended) {
  // Valida campos básicos obrigatórios
  if (habito.horasEstudo === null || habito.horasEstudo === undefined) {
    throw new Error('Campo obrigatório: horasEstudo');
  }
  if (habito.sono === null || habito.sono === undefined) {
    throw new Error('Campo obrigatório: sono');
  }
  if (habito.frequencia === null || habito.frequencia === undefined) {
    throw new Error('Campo obrigatório: frequencia');
  }

  // Converte motivacao (0-10) para Motivation_Level
  // Se Motivation_Level estiver preenchido, usa ele; senão converte de motivacao
  const motivationLevel = habito.Motivation_Level || convertMotivacaoToLevel(habito.motivacao ?? null);

  // Valida todos os campos obrigatórios adicionais
  const requiredFields = [
    { field: 'Previous_Scores', name: 'Notas Anteriores' },
    { field: 'Distance_from_Home', name: 'Distância de Casa' },
    { field: 'Gender', name: 'Gênero' },
    { field: 'Parental_Education_Level', name: 'Nível Educacional dos Pais' },
    { field: 'Parental_Involvement', name: 'Envolvimento dos Pais' },
    { field: 'School_Type', name: 'Tipo de Escola' },
    { field: 'Peer_Influence', name: 'Influência dos Pares' },
    { field: 'Extracurricular_Activities', name: 'Atividades Extracurriculares' },
    { field: 'Learning_Disabilities', name: 'Deficiências de Aprendizagem' },
    { field: 'Internet_Access', name: 'Acesso à Internet' },
    { field: 'Access_to_Resources', name: 'Acesso a Recursos' },
    { field: 'Teacher_Quality', name: 'Qualidade do Professor' },
    { field: 'Family_Income', name: 'Renda Familiar' },
    { field: 'Tutoring_Sessions', name: 'Sessões de Tutoria' },
    { field: 'Physical_Activity', name: 'Atividade Física' },
  ];

  const missingFields = requiredFields.filter(({ field }) => {
    const value = (habito as any)[field];
    return value === null || value === undefined || value === '';
  });

  if (missingFields.length > 0) {
    const fieldNames = missingFields.map(f => f.name).join(', ');
    throw new Error(`Campos obrigatórios não preenchidos: ${fieldNames}. Por favor, preencha todos os campos para obter uma predição precisa.`);
  }

  return {
    Hours_Studied: habito.horasEstudo!,
    Previous_Scores: habito.Previous_Scores!,
    Sleep_Hours: habito.sono!,
    Distance_from_Home: habito.Distance_from_Home!,
    Attendance: habito.frequencia!,
    Gender: habito.Gender!,
    Parental_Education_Level: habito.Parental_Education_Level!,
    Parental_Involvement: habito.Parental_Involvement!,
    School_Type: habito.School_Type!,
    Peer_Influence: habito.Peer_Influence!,
    Extracurricular_Activities: habito.Extracurricular_Activities!,
    Learning_Disabilities: habito.Learning_Disabilities!,
    Internet_Access: habito.Internet_Access!,
    Access_to_Resources: habito.Access_to_Resources!,
    Teacher_Quality: habito.Teacher_Quality!,
    Family_Income: habito.Family_Income!,
    Motivation_Level: motivationLevel,
    Tutoring_Sessions: habito.Tutoring_Sessions!,
    Physical_Activity: habito.Physical_Activity!,
  };
}

/**
 * Valida se os dados de hábitos estão completos para predição de evasão
 */
export function hasCompleteDropoutData(habito: AlunoHabitoExtended | null): boolean {
  if (!habito) return false;
  
  return !!(
    habito.raisedhands !== null &&
    habito.VisITedResources !== null &&
    habito.AnnouncementsView !== null &&
    habito.Discussion !== null &&
    habito.ParentAnsweringSurvey &&
    habito.ParentschoolSatisfaction &&
    habito.StudentAbsenceDays
  );
}

/**
 * Valida se os dados de hábitos estão completos para predição de desempenho
 */
export function hasCompletePerformanceData(habito: AlunoHabitoExtended | null): boolean {
  if (!habito) return false;
  
  return !!(
    habito.horasEstudo !== null &&
    habito.sono !== null &&
    habito.frequencia !== null &&
    habito.Previous_Scores !== null &&
    habito.Distance_from_Home &&
    habito.Gender &&
    habito.Parental_Education_Level &&
    habito.Parental_Involvement &&
    habito.School_Type &&
    habito.Peer_Influence &&
    habito.Extracurricular_Activities &&
    habito.Learning_Disabilities &&
    habito.Internet_Access &&
    habito.Access_to_Resources &&
    habito.Teacher_Quality &&
    habito.Family_Income &&
    habito.Motivation_Level &&
    habito.Tutoring_Sessions &&
    habito.Physical_Activity
  );
}

