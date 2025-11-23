import { apiConnection } from '../api/apiConnection';
import { getToken } from './tokenStore';

export interface Nota {
  IDNota: string;
  IDMatricula: string;
  Valor: number;
  Tipo?: string;
  DataAvaliacao: string;
  Observacoes?: string;
  createdAt: string;
  updatedAt: string;
  matricula?: {
    disciplina: {
      NomeDaDisciplina: string;
    };
    aluno: {
      Nome: string;
      Email: string;
    };
  };
}

export interface CreateNotaRequest {
  IDMatricula: string;
  Valor: number;
  Tipo?: string;
  DataAvaliacao?: string;
  Observacoes?: string;
}

export interface UpdateNotaRequest {
  Valor?: number;
  Tipo?: string;
  DataAvaliacao?: string;
  Observacoes?: string;
}

export const notaService = {
  // Buscar todas as notas de uma matrícula
  async getByMatricula(matriculaId: string): Promise<Nota[]> {
    try {
      const token = await getToken();
      const response = await apiConnection.get<Nota[]>(`/notas/matricula/${matriculaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar notas da matrícula:', error);
      throw error.response?.data || new Error('Erro ao buscar notas.');
    }
  },

  // Buscar todas as notas de um aluno
  async getByAluno(alunoId: string): Promise<any[]> {
    try {
      const token = await getToken();
      const response = await apiConnection.get<any[]>(`/notas/aluno/${alunoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar notas do aluno:', error);
      throw error.response?.data || new Error('Erro ao buscar notas do aluno.');
    }
  },

  // Buscar uma nota específica
  async getById(notaId: string): Promise<Nota> {
    try {
      const token = await getToken();
      const response = await apiConnection.get<Nota>(`/notas/${notaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar nota:', error);
      throw error.response?.data || new Error('Erro ao buscar nota.');
    }
  },

  // Criar uma nova nota
  async create(notaData: CreateNotaRequest): Promise<Nota> {
    try {
      const token = await getToken();
      const response = await apiConnection.post<Nota>('/notas', notaData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar nota:', error);
      throw error.response?.data || new Error('Erro ao criar nota.');
    }
  },

  // Atualizar uma nota
  async update(notaId: string, notaData: UpdateNotaRequest): Promise<Nota> {
    try {
      const token = await getToken();
      const response = await apiConnection.put<Nota>(`/notas/${notaId}`, notaData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar nota:', error);
      throw error.response?.data || new Error('Erro ao atualizar nota.');
    }
  },

  // Deletar uma nota
  async delete(notaId: string): Promise<void> {
    try {
      const token = await getToken();
      await apiConnection.delete(`/notas/${notaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      console.error('Erro ao deletar nota:', error);
      throw error.response?.data || new Error('Erro ao deletar nota.');
    }
  },
};

