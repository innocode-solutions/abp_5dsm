// src/service/PredictionService.ts

import axios from 'axios';
import { getToken } from './tokenStore';
import { API_URL } from '../config/api';

export interface EngagementData {
  raisedhands: number;
  VisITedResources: number;
  AnnouncementsView: number;
  Discussion: number;
  ParentAnsweringSurvey: 'Yes' | 'No';
  ParentschoolSatisfaction: 'Good' | 'Bad';
  StudentAbsenceDays: 'Under-7' | 'Above-7';
}

export interface PredictionResponse {
  success: boolean;
  message: string;
  data: {
    IDPrediction: string;
    IDMatricula: string;
    TipoPredicao: 'EVASAO' | 'DESEMPENHO';
    Probabilidade: number;
    Classificacao: string;
    Explicacao: string;
    createdAt: string;
  };
}

export interface PredictionError {
  error: string;
}

export const PredictionService = {
  /**
   * Gera uma predição de evasão com base nos dados de engajamento
   * Usa o novo endpoint /aluno-habitos/predict/dropout
   */
  async predictDropout(
    IDMatricula: string,
    engagementData: EngagementData
  ): Promise<PredictionResponse> {
    try {
      const token = await getToken();
      
      // Usa o novo endpoint que salva os dados e retorna a predição
      const response = await axios.post(
        `${API_URL}/aluno-habitos/predict/dropout`,
        engagementData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Adapta a resposta para o formato esperado
      const result = response.data;
      return {
        success: result.success,
        message: 'Predição gerada com sucesso',
        data: {
          IDPrediction: result.prediction.IDPrediction,
          IDMatricula: IDMatricula,
          TipoPredicao: 'EVASAO' as const,
          Probabilidade: result.prediction.probabilidade / 100,
          Classificacao: result.prediction.classificacao,
          Explicacao: result.prediction.explicacao,
          createdAt: result.prediction.createdAt,
        },
      };
    } catch (error: any) {
      // Tratamento específico para diferentes tipos de erro
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data as PredictionError;
        
        if (status === 503) {
          throw new Error('Serviço de predição temporariamente indisponível. Tente novamente mais tarde.');
        }
        if (status === 504) {
          throw new Error('Timeout ao processar predição. Tente novamente.');
        }
        if (status === 404) {
          throw new Error('Aluno não encontrado ou sem matrícula ativa.');
        }
        if (status === 400 || status === 422) {
          throw new Error(errorData.error || 'Dados inválidos. Verifique os campos preenchidos.');
        }
        throw new Error(errorData.error || 'Erro ao processar predição.');
      }
      
      if (error.request) {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      
      throw new Error('Erro desconhecido ao processar predição.');
    }
  },

  /**
   * Gera uma predição de desempenho com base nos hábitos do aluno
   */
  async predictPerformance(habitData: any): Promise<any> {
    try {
      const token = await getToken();
      
      const response = await axios.post(
        `${API_URL}/aluno-habitos/predict/performance`,
        habitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 503) {
          throw new Error('Serviço de predição temporariamente indisponível. Tente novamente mais tarde.');
        }
        if (status === 504) {
          throw new Error('Timeout ao processar predição. Tente novamente.');
        }
        if (status === 404) {
          throw new Error('Aluno não encontrado ou sem matrícula ativa.');
        }
        if (status === 400 || status === 422) {
          throw new Error(errorData.error || 'Dados inválidos. Verifique os campos preenchidos.');
        }
        throw new Error(errorData.error || 'Erro ao processar predição.');
      }
      
      if (error.request) {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      
      throw new Error('Erro desconhecido ao processar predição.');
    }
  },

  /**
   * Busca matrículas do aluno atual
   */
  async getStudentMatriculas(alunoId: string): Promise<any[]> {
    try {
      const token = await getToken();
      
      const response = await axios.get(
        `${API_URL}/matriculas/aluno/${alunoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Erro ao buscar matrículas.' };
    }
  },

  /**
   * Busca o aluno associado ao usuário atual através do endpoint /auth/me
   */
  async getStudentByUser(): Promise<any> {
    try {
      const token = await getToken();
      
      // Usa o endpoint /auth/me que retorna o usuário com seus alunos
      const response = await axios.get(
        `${API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const user = response.data;
      
      // Verifica se o usuário tem alunos associados
      if (!user.alunos || user.alunos.length === 0) {
        throw new Error('Nenhum aluno encontrado para este usuário.');
      }
      
      // Retorna o primeiro aluno (assumindo que um usuário tem apenas um aluno)
      return user.alunos[0];
    } catch (error: any) {
      if (error.response) {
        throw error.response.data || { message: 'Erro ao buscar dados do aluno.' };
      }
      throw error;
    }
  },
};

