import axios from 'axios';
import { PrismaClient, TipoPredicao } from '@prisma/client';

const prisma = new PrismaClient();
const ML_BASE_URL = process.env.ML_BASE_URL || 'http://localhost:5000';
const ML_TIMEOUT = parseInt(process.env.ML_TIMEOUT_MS || '10000');

export interface MLPredictionResponse {
  prediction: string;
  probability: number;
  explanation: string;
}

// Raw response interfaces from ML service
interface MLDropoutResponse {
  probability_dropout: number;
  class_dropout: string;
  explain: string;
}

interface MLPerformanceResponse {
  predicted_score: number;
  confidence: number;
  is_approved: boolean;
  approval_status: string;
  grade_category: string;
  factors: Array<{
    feature: string;
    value: number;
    influence: string;
  }>;
  saved: boolean;
}

type AxiosErrorWithCode = {
  isAxiosError: true
  code?: string
  response?: {
    status?: number
    data?: unknown
  }
}

function isAxiosError(error: unknown): error is AxiosErrorWithCode {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error && Boolean((error as any).isAxiosError)
}

async function callDropoutService(data: any): Promise<MLPredictionResponse> {
  try {
    const response = await axios.post<MLDropoutResponse>(
      `${ML_BASE_URL}/predict/dropout`,
      data,
      {
        timeout: ML_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Dropout Service Raw Response:', response.data);

    // Map dropout response to standardized format
    return {
      prediction: response.data.class_dropout,
      probability: response.data.probability_dropout,
      explanation: response.data.explain
    };
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Timeout ao conectar com o serviço de ML');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Serviço de ML indisponível');
      }
    }
    throw error;
  }
}

async function callPerformanceService(data: any): Promise<MLPredictionResponse> {
  try {
    const response = await axios.post<MLPerformanceResponse>(
      `${ML_BASE_URL}/predict/performance`,
      data,
      {
        timeout: ML_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Performance Service Raw Response:', response.data);

    // Map performance response to standardized format
    const factorsExplanation = response.data.factors
      .map(f => `${f.feature}: ${f.value} (influência ${f.influence})`)
      .join(', ');

    const explanation = `Nota prevista: ${response.data.predicted_score.toFixed(2)}, ` +
      `Status: ${response.data.approval_status}, ` +
      `Categoria: ${response.data.grade_category}. ` +
      `Fatores principais: ${factorsExplanation}`;

    return {
      prediction: response.data.approval_status,
      probability: response.data.confidence,
      explanation: explanation
    };
  } catch (error) {
    if (isAxiosError(error)) {
      // Log the validation errors from ML service
      const responseData = error.response?.data
      if (error.response?.status === 422) {
        console.error('ML Service Validation Error:', JSON.stringify(responseData, null, 2));
        throw new Error(`Dados inválidos para o serviço de ML: ${JSON.stringify(responseData)}`);
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Timeout ao conectar com o serviço de ML');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Serviço de ML indisponível');
      }
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao chamar serviço de ML');
  }
}

export async function savePrediction(
  IDMatricula: string,
  tipo: TipoPredicao,
  mlResponse: MLPredictionResponse,
  dadosEntrada: any
) {
  // Validate ML response before saving
  if (!mlResponse.prediction || mlResponse.probability === undefined) {
    throw new Error('Resposta inválida do serviço de ML');
  }

  return await prisma.prediction.create({
    data: {
      IDMatricula,
      TipoPredicao: tipo,
      Probabilidade: mlResponse.probability,
      Classificacao: mlResponse.prediction,
      Explicacao: mlResponse.explanation || 'Sem explicação disponível',
      DadosEntrada: dadosEntrada
    },
    include: {
      matricula: {
        include: {
          aluno: true,
          disciplina: true,
          periodo: true
        }
      }
    }
  });
}

export async function callMLService(
  tipoPredicao: 'EVASAO' | 'DESEMPENHO',
  dados: any
): Promise<MLPredictionResponse> {
  console.log(`Calling ML service for ${tipoPredicao} with data:`, dados);

  const response = tipoPredicao === 'EVASAO' 
    ? await callDropoutService(dados)
    : await callPerformanceService(dados);

  console.log('Standardized ML Response:', response);

  return response;
}