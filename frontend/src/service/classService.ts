import { apiConnection } from '../api/apiConnection';
import { getProfessorDashboard, Discipline } from './dashboardService';

export interface Class {
  IDDisciplina: string;
  NomeDaDisciplina: string;
  CodigoDaDisciplina?: string;
  studentCount: number;
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
          console.warn(`Erro ao buscar alunos da disciplina ${discipline.IDDisciplina}:`, error);
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

