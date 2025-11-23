/**
 * Serviço para buscar feedbacks formatados da API
 */

import { apiConnection } from '../api/apiConnection';

export interface FeedbackFeature {
  feature: string;
  value: string | number;
  influence: 'positiva' | 'negativa';
}

export interface ApiFeedback {
  IDPrediction: string;
  tipo: 'DESEMPENHO' | 'EVASAO';
  disciplina: string;
  title: string;
  message: string;
  features: FeedbackFeature[];
  suggestions: string[];
  data: string;
  probabilidade: number;
  classificacao: string;
  notaPrevista?: number; // Nota prevista (0-10) para exibição
  predicted_score?: number; // Nota prevista (0-100) para lógica de cores/notificações
}

/**
 * Busca feedbacks do aluno logado
 */
export async function getMyFeedbacks(): Promise<ApiFeedback[]> {
  try {
    const response = await apiConnection.get<ApiFeedback[]>('/feedbacks/me');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar feedbacks:', error);
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * Busca feedbacks de um aluno específico (para professores)
 */
export async function getStudentFeedbacks(studentId: string): Promise<ApiFeedback[]> {
  try {
    const response = await apiConnection.get<ApiFeedback[]>(`/feedbacks/student/${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar feedbacks do aluno:', error);
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

