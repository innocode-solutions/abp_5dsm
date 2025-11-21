import { apiConnection } from '../api/apiConnection';

export interface Curso {
  IDCurso: string;
  NomeDoCurso: string;
  Descricao?: string;
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
}

export interface CreateUserResponse {
  IDUser: string;
  Email: string;
  name: string | null;
  Role: string;
  createdAt: string;
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
};

