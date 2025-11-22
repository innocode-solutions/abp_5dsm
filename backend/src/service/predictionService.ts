import axios from 'axios';
import { PrismaClient, TipoPredicao } from '@prisma/client';

const prisma = new PrismaClient();
const ML_BASE_URL = process.env.ML_BASE_URL || 'http://localhost:5000';
const ML_TIMEOUT = parseInt(process.env.ML_TIMEOUT_MS || '10000');

export interface MLPredictionResponse {
  prediction: string;
  probability: number;
  explanation: string;
  predicted_score?: number; // 0-100 para predições de desempenho
  approval_status?: string;
  grade_category?: string;
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

/**
 * Melhora a explicação de evasão baseada nos dados de entrada do aluno
 * Identifica features relevantes que podem estar impactando o risco
 */
function improveDropoutExplanation(
  originalExplain: string,
  studentData: any,
  probability: number
): string {
  const features: Array<{ name: string; value: any; influence: 'positiva' | 'negativa' }> = [];

  // Analisa cada feature e determina se está impactando negativamente
  // Valores baixos de engajamento aumentam risco de evasão
  
  // Participação em aula (raisedhands)
  if (studentData.raisedhands !== undefined) {
    const value = Number(studentData.raisedhands);
    if (value < 15) {
      features.push({ name: 'raisedhands', value, influence: 'negativa' });
    } else if (value >= 30) {
      features.push({ name: 'raisedhands', value, influence: 'positiva' });
    }
  }

  // Materiais acessados (VisITedResources)
  if (studentData.VisITedResources !== undefined) {
    const value = Number(studentData.VisITedResources);
    if (value < 15) {
      features.push({ name: 'VisITedResources', value, influence: 'negativa' });
    } else if (value >= 25) {
      features.push({ name: 'VisITedResources', value, influence: 'positiva' });
    }
  }

  // Avisos visualizados (AnnouncementsView)
  if (studentData.AnnouncementsView !== undefined) {
    const value = Number(studentData.AnnouncementsView);
    if (value < 10) {
      features.push({ name: 'AnnouncementsView', value, influence: 'negativa' });
    } else if (value >= 25) {
      features.push({ name: 'AnnouncementsView', value, influence: 'positiva' });
    }
  }

  // Discussões (Discussion)
  if (studentData.Discussion !== undefined) {
    const value = Number(studentData.Discussion);
    if (value < 15) {
      features.push({ name: 'Discussion', value, influence: 'negativa' });
    } else if (value >= 30) {
      features.push({ name: 'Discussion', value, influence: 'positiva' });
    }
  }

  // Faltas (StudentAbsenceDays)
  if (studentData.StudentAbsenceDays) {
    const isHighAbsence = studentData.StudentAbsenceDays === 'Above-7';
    features.push({
      name: 'StudentAbsenceDays',
      value: studentData.StudentAbsenceDays,
      influence: isHighAbsence ? 'negativa' : 'positiva'
    });
  }

  // Ordena por impacto (negativas primeiro se risco alto, positivas primeiro se risco baixo)
  const negativeFeatures = features.filter(f => f.influence === 'negativa');
  const positiveFeatures = features.filter(f => f.influence === 'positiva');
  
  // Se risco alto, prioriza features negativas; se risco baixo, prioriza positivas
  const sortedFeatures = probability >= 0.5 
    ? [...negativeFeatures, ...positiveFeatures]
    : [...positiveFeatures, ...negativeFeatures];

  // Pega top 3 features mais relevantes
  const topFeatures = sortedFeatures.slice(0, 3);

  // Mapeia nomes técnicos para nomes amigáveis
  const friendlyNames: Record<string, string> = {
    'raisedhands': 'Participação em Aula',
    'VisITedResources': 'Materiais Acessados',
    'AnnouncementsView': 'Avisos Visualizados',
    'Discussion': 'Participações em Discussões',
    'StudentAbsenceDays': 'Faltas Escolares'
  };

  if (topFeatures.length > 0) {
    const explanationParts = topFeatures.map(f => {
      const friendlyName = friendlyNames[f.name] || f.name;
      let displayValue = f.value;
      
      // Formata valores para exibição
      if (f.name === 'StudentAbsenceDays') {
        displayValue = f.value === 'Above-7' ? 'Acima de 7 faltas' : 'Menos de 7 faltas';
      }
      
      return `${friendlyName}: ${displayValue} (influência ${f.influence})`;
    });
    
    return explanationParts.join(', ');
  }

  // Fallback: tenta identificar pelo menos uma feature relevante baseada nos dados
  // Mesmo que não atinja os thresholds, identifica a mais crítica
  if (features.length > 0) {
    // Pega a primeira feature (já ordenada por relevância)
    const firstFeature = features[0];
    const friendlyName = friendlyNames[firstFeature.name] || firstFeature.name;
    let displayValue = firstFeature.value;
    
    if (firstFeature.name === 'StudentAbsenceDays') {
      displayValue = firstFeature.value === 'Above-7' ? 'Acima de 7 faltas' : 'Menos de 7 faltas';
    }
    
    return `${friendlyName}: ${displayValue} (influência ${firstFeature.influence})`;
  }

  // Último fallback: explicação baseada na probabilidade
  const risco = probability < 0.33 ? 'baixo' : probability < 0.66 ? 'médio' : 'alto';
  return `Risco de evasão ${risco} (${(probability * 100).toFixed(1)}%). Foque em aumentar seu engajamento com as atividades escolares.`;
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

    // Melhora o explain baseado nos dados de entrada para identificar features relevantes
    const improvedExplanation = improveDropoutExplanation(response.data.explain, data, response.data.probability_dropout);

    // Map dropout response to standardized format
    return {
      prediction: response.data.class_dropout,
      probability: response.data.probability_dropout,
      explanation: improvedExplanation
    };
  } catch (error) {
    if (isAxiosError(error)) {
      const responseData = error.response?.data
   if (error.response?.status === 422) {
    console.error('ML Service Validation Error:', JSON.stringify(responseData, null, 2));
    // Lança o erro para o controller/teste
    throw new Error(`Dados inválidos para o serviço de ML: ${JSON.stringify(responseData)}`);
   }
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

    // Constrói explicação a partir dos factors (features mais relevantes)
    // Formato esperado pelo FeedbackService: "feature: value (influência positiva/negativa)"
    let explanation: string;
    if (response.data.factors && response.data.factors.length > 0) {
      // Usa os top 3 factors (já ordenados por relevância pelo ML)
      const topFactors = response.data.factors.slice(0, 3);
      const factorsExplanation = topFactors
        .map(f => {
          // Normaliza a influência para o formato esperado
          const influence = f.influence.toLowerCase().includes('positiva') ? 'positiva' : 
                           f.influence.toLowerCase().includes('negativa') ? 'negativa' : 
                           f.influence;
          
          // Corrige o valor se a feature for Attendance - usa o valor original dos dados
          // O ML pode retornar um valor incorreto devido ao mapeamento de features após pré-processamento
          let displayValue = f.value;
          if (f.feature === 'Attendance' && data.Attendance !== undefined) {
            displayValue = data.Attendance;
          }
          
          return `${f.feature}: ${displayValue} (influência ${influence})`;
        })
        .join(', ');
      
      explanation = factorsExplanation;
    } else {
      // Fallback se não houver factors
      explanation = `Nota prevista: ${response.data.predicted_score.toFixed(2)}, ` +
        `Status: ${response.data.approval_status}, ` +
        `Categoria: ${response.data.grade_category}.`;
    }

    return {
      prediction: response.data.approval_status,
      probability: response.data.confidence,
      explanation: explanation,
      predicted_score: response.data.predicted_score, // 0-100
      approval_status: response.data.approval_status,
      grade_category: response.data.grade_category
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