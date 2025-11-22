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
 * Busca o ID do aluno associado ao usuário logado
 */
export async function getStudentIdByUserId(): Promise<string | null> {
  try {
    // Usar o endpoint /auth/me que retorna o usuário com seus alunos
    const response = await apiConnection.get<{
      IDUser: string;
      alunos?: Array<{ IDAluno: string }>;
    }>(`/auth/me`);
    
    if (response.data.alunos && response.data.alunos.length > 0) {
      return response.data.alunos[0].IDAluno;
    }
    return null;
  } catch (error: any) {
    console.error('Erro ao buscar ID do aluno:', error);
    return null;
  }
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
    if (error.response?.status === 403) {
      throw new Error('Acesso negado. Você só pode acessar seus próprios dados.');
    }
    throw new Error('Erro ao buscar dados do aluno. Tente novamente.');
  }
}

/**
 * Busca dados do aluno atual (do usuário logado)
 */
export async function getCurrentStudentDetails(): Promise<StudentDetails | null> {
  try {
    // Primeiro, buscar o ID do aluno do usuário atual
    const studentId = await getStudentIdByUserId();
    if (!studentId) {
      return null;
    }
    
    // Depois, buscar os detalhes completos
    return await getStudentDetails(studentId);
  } catch (error: any) {
    console.error('Erro ao buscar dados do aluno atual:', error);
    return null;
  }
}

