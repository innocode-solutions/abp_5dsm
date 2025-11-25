import { apiConnection } from '../api/apiConnection';
import { getProfessorDashboard, Discipline } from './dashboardService';

export interface Class {
  IDDisciplina: string;
  NomeDaDisciplina: string;
  CodigoDaDisciplina?: string;
  studentCount: number;
}

export interface CreateClassData {
  IDCurso: string;
  NomeDaDisciplina: string;
  CodigoDaDisciplina?: string;
  CargaHoraria?: number;
  Ativa?: boolean;
}

/**
 * Busca todas as turmas (classes) do professor com contagem de alunos
 */
export async function getTeacherClasses(professorId: string): Promise<Class[]> {
  try {
    // Buscar dashboard do professor que já retorna as disciplinas
    const dashboard = await getProfessorDashboard(professorId);
    
    // Para cada disciplina, buscar a contagem de alunos
    return await Promise.all(
      dashboard.disciplinas.map(async (discipline) => {
        try {
          // Buscar alunos da disciplina
          const response = await apiConnection.get<{ id: string }[]>(
            `/alunos/students/class/${discipline.IDDisciplina}`
          );
          return {
            IDDisciplina: discipline.IDDisciplina,
            NomeDaDisciplina: discipline.NomeDaDisciplina,
            CodigoDaDisciplina: discipline.CodigoDaDisciplina,
            studentCount: response.data.length,
          };
        } catch (error) {
          // Se houver erro ao buscar alunos, retornar com contagem 0
          return {
            IDDisciplina: discipline.IDDisciplina,
            NomeDaDisciplina: discipline.NomeDaDisciplina,
            CodigoDaDisciplina: discipline.CodigoDaDisciplina,
            studentCount: 0,
          };
        }
      })
    );
  } catch (error: any) {
    console.error('Erro ao buscar turmas do professor:', error);
    if (error.response?.status === 404) {
      throw new Error('Professor não encontrado');
    }
    if (error.response?.status === 401) {
      throw new Error('Não autorizado. Faça login novamente.');
    }
    throw new Error('Erro ao buscar turmas. Tente novamente.');
  }
}

/**
 * Cria uma nova disciplina (turma)
 */
export async function createClass(data: CreateClassData): Promise<Class> {
  try {
    const response = await apiConnection.post<{
      IDDisciplina: string;
      NomeDaDisciplina: string;
      CodigoDaDisciplina?: string;
    }>('/disciplinas', data);
    
    return {
      IDDisciplina: response.data.IDDisciplina,
      NomeDaDisciplina: response.data.NomeDaDisciplina,
      CodigoDaDisciplina: response.data.CodigoDaDisciplina,
      studentCount: 0,
    };
  } catch (error: any) {
    console.error('Erro ao criar turma:', error);
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Dados inválidos');
    }
    if (error.response?.status === 401) {
      throw new Error('Não autorizado. Faça login novamente.');
    }
    if (error.response?.status === 403) {
      throw new Error(error.response.data.error || 'Você não tem permissão para criar turmas. Entre em contato com o administrador.');
    }
    if (error.response?.status === 409) {
      throw new Error(error.response.data.error || 'Código da disciplina já existe para este curso');
    }
    throw new Error(error.response?.data?.error || 'Erro ao criar turma. Tente novamente.');
  }
}

