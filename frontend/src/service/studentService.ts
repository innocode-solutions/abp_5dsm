import { apiConnection } from '../api/apiConnection';

export interface Student {
  id: string;
  name: string;
  email: string;
  performance_score: number | null; // 0-100
  dropout_risk: 'baixo' | 'médio' | 'alto' | null;
}

/**
 * Busca todos os alunos de uma turma (disciplina) com suas notas previstas e riscos
 */
export async function getStudentsByClass(subjectId: string): Promise<Student[]> {
  try {
    const response = await apiConnection.get<Student[]>(`/alunos/students/class/${subjectId}`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar alunos da turma:', error);
    if (error.response?.status === 404) {
      throw new Error('Disciplina não encontrada');
    }
    if (error.response?.status === 401) {
      throw new Error('Não autorizado. Faça login novamente.');
    }
    throw new Error('Erro ao buscar alunos da turma. Tente novamente.');
  }
}

