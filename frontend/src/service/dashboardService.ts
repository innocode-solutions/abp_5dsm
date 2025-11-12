import { apiConnection } from '../api/apiConnection';
import { useAuth } from '../context/AuthContext';

export interface Discipline {
  IDDisciplina: string;
  NomeDaDisciplina: string;
  CodigoDaDisciplina?: string;
}

export interface ProfessorDashboard {
  professor: {
    id: string;
    nome: string;
    email: string;
  };
  disciplinas: Discipline[];
  periodos: any[];
  totalAlunos: number;
  metricas: any;
}

/**
 * Busca o dashboard do professor
 */
export async function getProfessorDashboard(professorId: string): Promise<ProfessorDashboard> {
  try {
    const response = await apiConnection.get<ProfessorDashboard>(
      `/dashboard/professor/${professorId}`
    );
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

