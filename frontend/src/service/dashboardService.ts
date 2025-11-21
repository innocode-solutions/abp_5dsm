import { apiConnection } from '../api/apiConnection';

export interface Discipline {
  IDDisciplina: string;
  NomeDaDisciplina: string;
  CodigoDaDisciplina?: string;
}

export interface DashboardMetrics {
  mediaNotas: number;
  percentualAprovados: number;
  percentualRiscoAltoEvasao: number;
  distribuicaoNotas: {
    aprovados: number;
    reprovados: number;
    semNota: number;
  };
  distribuicaoRiscoEvasao: {
    baixo: number;
    medio: number;
    alto: number;
    semPredicao: number;
  };
}

export interface AlunoDashboard {
  id: string;
  nome: string;
  email: string;
  semestre: number | null;
  disciplina: {
    id: string;
    nome: string;
    codigo: string | null;
  };
  periodo: {
    id: string;
    nome: string;
    dataInicio: Date;
    dataFim: Date;
  };
  nota: number | null;
  status: string;
  predicoes: {
    desempenho: {
      probabilidade: number;
      classificacao: string;
      explicacao: string | null;
      dataPredicao: Date;
    } | null;
    evasao: {
      probabilidade: number;
      classificacao: string;
      explicacao: string | null;
      dataPredicao: Date;
    } | null;
  };
}

export interface ProfessorDashboard {
  professor: {
    id: string;
    nome: string;
    email: string;
  };
  filtros: {
    disciplinaId: string | null;
    periodoId: string | null;
  };
  metricas: DashboardMetrics;
  alunos: AlunoDashboard[];
  disciplinas: Discipline[];
  periodos: any[];
  totalAlunos: number;
  timestamp: string;
}

/**
 * Busca o dashboard do professor
 */
export async function getProfessorDashboard(
  professorId: string,
  disciplinaId?: string,
  periodoId?: string
): Promise<ProfessorDashboard> {
  try {
    const params = new URLSearchParams();
    if (disciplinaId) params.append('disciplinaId', disciplinaId);
    if (periodoId) params.append('periodoId', periodoId);
    
    const queryString = params.toString();
    const url = `/dashboard/professor/${professorId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiConnection.get<ProfessorDashboard>(url);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar dashboard do professor:', error);
    if (error.response?.status === 404) {
      throw new Error('Professor não encontrado');
    }
    if (error.response?.status === 401) {
      throw new Error('Não autorizado. Faça login novamente.');
    }
    throw new Error('Erro ao buscar dashboard do professor. Tente novamente.');
  }
}

export interface IESOverview {
  resumo: {
    totalCursos: number;
    totalDisciplinas: number;
    totalAlunos: number;
    totalMatriculas: number;
    totalPeriodos: number;
    evasaoMedia: string;
    desempenhoMedio: number;
  };
  cursosMaisPopulares: Array<{
    id: string;
    curso: string;
    alunos: number;
  }>;
  disciplinasMaisCursadas: Array<{
    id: string;
    disciplina: string;
    matriculas: number;
  }>;
  statusMatriculas: Array<{
    status: string;
    total: number;
  }>;
  percentualPorCurso: Array<{
    curso: string;
    alunos: number;
    percentual: string;
  }>;
  top3CursosRisco: Array<{
    curso: string;
    evasao: number;
  }>;
}

export interface IESAggregates {
  filtros: {
    courseId: string | null;
    subjectId: string | null;
    professorId: string | null;
  };
  agregadoGeral: {
    mediaNota: number;
    percentualAprovacao: number;
    percentualEvasao: number;
  };
  porCurso: Array<{
    idCurso: string;
    nomeCurso: string;
    mediaNota: number;
    percentualAprovacao: number;
    percentualEvasao: number;
  }>;
  porDisciplina: Array<{
    idDisciplina: string;
    nomeDisciplina: string;
    idCurso: string;
    nomeCurso: string;
    mediaNota: number;
    percentualAprovacao: number;
    percentualEvasao: number;
  }>;
}

/**
 * Busca overview do dashboard IES
 */
export async function getIESOverview(
  courseId?: string,
  subjectId?: string,
  professorId?: string
): Promise<IESOverview> {
  try {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (subjectId) params.append('subjectId', subjectId);
    if (professorId) params.append('professorId', professorId);
    
    const queryString = params.toString();
    const url = `/dashboard/ies/overview${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiConnection.get<IESOverview>(url);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar overview da IES:', error);
    if (error.response?.status === 401) {
      throw new Error('Não autorizado. Faça login novamente.');
    }
    throw new Error('Erro ao buscar dados da IES. Tente novamente.');
  }
}

/**
 * Busca agregados do dashboard IES
 */
export async function getIESAggregates(
  courseId?: string,
  subjectId?: string,
  professorId?: string
): Promise<IESAggregates> {
  try {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (subjectId) params.append('subjectId', subjectId);
    if (professorId) params.append('professorId', professorId);
    
    const queryString = params.toString();
    const url = `/dashboard/ies${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiConnection.get<IESAggregates>(url);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar agregados da IES:', error);
    if (error.response?.status === 401) {
      throw new Error('Não autorizado. Faça login novamente.');
    }
    throw new Error('Erro ao buscar dados da IES. Tente novamente.');
  }
}

