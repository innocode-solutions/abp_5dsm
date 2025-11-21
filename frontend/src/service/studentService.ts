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

export interface StudentDetails {
  IDAluno: string;
  Nome: string;
  Email: string;
  Matricula?: string;
  curso?: {
    IDCurso: string;
    NomeDoCurso: string;
  };
  matriculas: Array<{
    IDMatricula: string;
    disciplina: {
      IDDisciplina: string;
      NomeDaDisciplina: string;
      CodigoDaDisciplina?: string;
    };
    periodo: {
      IDPeriodo: string;
      Nome: string;
    };
    predictions?: Array<{
      TipoPredicao: 'DESEMPENHO' | 'EVASAO';
      Probabilidade: number;
      Classificacao: string;
      createdAt: string;
    }>;
  }>;
}

/**
 * Busca dados completos do aluno incluindo matrículas e predições
 */
export async function getStudentDetails(studentId: string): Promise<StudentDetails> {
  try {
    const response = await apiConnection.get<StudentDetails>(`/alunos/${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar detalhes do aluno:', error);
    if (error.response?.status === 404) {
      throw new Error('Aluno não encontrado');
    }
    if (error.response?.status === 401) {
      throw new Error('Não autorizado. Faça login novamente.');
    }
    throw new Error('Erro ao buscar dados do aluno. Tente novamente.');
  }
}

