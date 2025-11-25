import { apiConnection } from '../api/apiConnection';

export interface Curso {
  IDCurso: string;
  NomeDoCurso: string;
  Descricao?: string;
}

export interface Disciplina {
  IDDisciplina: string;
  NomeDaDisciplina: string;
  CodigoDaDisciplina?: string;
  IDCurso: string;
  curso?: {
    IDCurso: string;
    NomeDoCurso: string;
  };
}

export interface CreateUserRequest {
  Email: string;
  password: string;
  Role: 'STUDENT' | 'TEACHER';
  name: string;
  alunoData?: {
    Nome: string;
    Semestre: number;
    IDCurso: string;
  };
  disciplinaData?: {
    IDDisciplina: string;
  };
}

export interface UpdateUserRequest {
  Email?: string;
  Role?: 'STUDENT' | 'TEACHER';
  name?: string;
  alunoData?: {
    Nome?: string;
    Semestre?: number;
    IDCurso?: string;
  };
}

export interface CreateUserResponse {
  IDUser: string;
  Email: string;
  name: string | null;
  Role: string;
  createdAt: string;
  alunos?: Array<{
    IDAluno: string;
    Nome: string;
    Email: string;
    Semestre: number;
    curso?: {
      IDCurso: string;
      NomeDoCurso: string;
    };
  }>;
}

export const userService = {
  /**
   * Busca lista de cursos disponíveis
   */
  getCursos: async (): Promise<Curso[]> => {
    try {
      const response = await apiConnection.get<{ data: Curso[] }>('/cursos', {
        params: {
          limit: 100, // Buscar todos os cursos
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao buscar cursos:', error);
      throw error;
    }
  },

  /**
   * Busca lista de disciplinas disponíveis
   */
  getDisciplinas: async (): Promise<Disciplina[]> => {
    try {
      const response = await apiConnection.get<{ data: Disciplina[] }>('/disciplinas', {
        params: {
          limit: 100, // Buscar todas as disciplinas
          ativa: 'true', // Apenas disciplinas ativas
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao buscar disciplinas:', error);
      throw error;
    }
  },

  /**
   * Cria um novo usuário (aluno ou professor)
   */
  createUser: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    try {
      const response = await apiConnection.post<CreateUserResponse>('/users', data);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  /**
   * Busca lista de usuários
   */
  getUsers: async (): Promise<CreateUserResponse[]> => {
    try {
      // A API retorna { users: [...], pagination: ... }
      const response = await apiConnection.get<{ users: CreateUserResponse[] }>('/users');
      return response.data.users || [];
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  /**
   * Busca um usuário por ID
   */
  getUserById: async (id: string): Promise<CreateUserResponse> => {
    try {
      const response = await apiConnection.get<CreateUserResponse>(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  },

  /**
   * Atualiza um usuário existente
   */
  updateUser: async (id: string, data: UpdateUserRequest): Promise<CreateUserResponse> => {
    try {
      const response = await apiConnection.put<CreateUserResponse>(`/users/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  /**
   * Exclui um usuário
   */
  deleteUser: async (id: string): Promise<void> => {
    try {
      await apiConnection.delete(`/users/${id}`);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  },
};

