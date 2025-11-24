import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

interface DropoutPredictionResult {
  probability_dropout: number;
  class_dropout: string;
  explain: string;
}

interface PerformancePredictionResult {
  predicted_score: number;
  confidence: number;
  is_approved: boolean;
  approval_status: string;
  grade_category: string;
  factors: Array<{
    feature: string;
    value: number | string;
    influence: string;
  }>;
  saved: boolean;
}

/**
 * Prediz risco de evasão usando o serviço externo de ML
 */
export async function predictDropout(data: any): Promise<DropoutPredictionResult> {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/dropout`, data);
    return response.data as DropoutPredictionResult;
  } catch (error: any) {
    console.error('Erro ao chamar serviço de ML (Dropout):', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
    throw new Error(`Erro ao prever evasão: ${error.message}`);
  }
}

/**
 * Prediz desempenho acadêmico usando o serviço externo de ML
 */
export async function predictPerformance(data: any): Promise<PerformancePredictionResult> {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/performance`, data);
    return response.data as PerformancePredictionResult;
  } catch (error: any) {
    console.error('Erro ao chamar serviço de ML (Performance):', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
    throw new Error(`Erro ao prever desempenho: ${error.message}`);
  }
}

/**
 * Verifica se o serviço ML está disponível
 */
export async function checkMLServiceHealth(): Promise<{
  available: boolean;
  message: string;
}> {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });

    if (response.status === 200) {
      return {
        available: true,
        message: 'Serviço ML disponível'
      };
    }

    return {
      available: false,
      message: `Serviço ML retornou status ${response.status}`
    };
  } catch (error: any) {
    return {
      available: false,
      message: `Serviço ML indisponível: ${error.message}`
    };
  }
}

