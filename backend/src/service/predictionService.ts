import { PrismaClient, TipoPredicao } from '@prisma/client';
import { predictDropout, predictPerformance } from './mlService';
import { 
  notificarNovaPredicaoDesempenho, 
  notificarNovaPredicaoEvasao,
  notificarProfessorBaixoDesempenho,
  notificarProfessorAltoRiscoEvasao,
  notificarProfessorFormularioCompleto
} from './notificacaoService';

const prisma = new PrismaClient();

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
    value: number | string;
    influence: string;
  }>;
  saved: boolean;
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
    const response = await predictDropout(data);

    // Melhora o explain baseado nos dados de entrada para identificar features relevantes
    const improvedExplanation = improveDropoutExplanation(response.explain, data, response.probability_dropout);

    // Map dropout response to standardized format
    return {
      prediction: response.class_dropout,
      probability: response.probability_dropout,
      explanation: improvedExplanation
    };
  } catch (error: any) {
    if (error.message?.includes('Dados inválidos')) {
      console.error('ML Service Validation Error');
      throw new Error(`Dados inválidos para o serviço de ML: ${error.message}`);
    }
    if (error.message?.includes('Timeout')) {
      throw new Error('Timeout ao processar predição de ML');
    }
    if (error.message?.includes('indisponível') || error.message?.includes('não encontrado')) {
      throw new Error('Serviço de ML indisponível');
    }
    throw error;
  }
}

async function callPerformanceService(data: any): Promise<MLPredictionResponse> {
  try {
    const response = await predictPerformance(data);

    // Constrói explicação a partir dos factors (features mais relevantes)
    // Formato esperado pelo FeedbackService: "feature: value (influência positiva/negativa)"
    let explanation: string;
    if (response.factors && response.factors.length > 0) {
      // Usa os top 3 factors (já ordenados por relevância pelo ML)
      const topFactors = response.factors.slice(0, 3);
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
      // Fallback se não houver factors - criar mensagem mais amigável
      const notaFormatada = (response.predicted_score / 10).toFixed(1);
      const statusFormatado = response.approval_status?.toLowerCase() === 'approved' 
        ? 'Aprovado' 
        : response.approval_status?.toLowerCase() === 'rejected' 
          ? 'Reprovado' 
          : response.approval_status || 'Em análise';
      
      // Mapear categoria para português de forma mais amigável
      const categoriaMap: Record<string, string> = {
        'EXCELLENT': 'Excelente',
        'VERY_GOOD': 'Muito Bom',
        'GOOD': 'Bom',
        'SUFFICIENT': 'Suficiente',
        'INSUFFICIENT': 'Insuficiente',
        'BOM': 'Bom',
        'MUITO_BOM': 'Muito Bom',
        'EXCELENTE': 'Excelente',
        'SUFICIENTE': 'Suficiente',
        'INSUFICIENTE': 'Insuficiente',
      };
      const categoriaFormatada = categoriaMap[response.grade_category?.toUpperCase() || ''] || response.grade_category || 'Não definida';
      
      // Criar mensagem mais natural e amigável
      if (response.predicted_score >= 60) {
        explanation = `Parabéns! Sua nota prevista é ${notaFormatada}/10 (${response.predicted_score.toFixed(1)} pontos), o que indica que você está ${statusFormatado.toLowerCase()}. Seu desempenho está classificado como ${categoriaFormatada.toLowerCase()}. Continue mantendo seus bons hábitos de estudo!`;
      } else {
        explanation = `Sua nota prevista é ${notaFormatada}/10 (${response.predicted_score.toFixed(1)} pontos), o que indica que você está ${statusFormatado.toLowerCase()}. Seu desempenho está classificado como ${categoriaFormatada.toLowerCase()}. É importante focar em melhorar seus hábitos de estudo para alcançar a aprovação.`;
      }
    }

    return {
      prediction: response.approval_status,
      probability: response.confidence,
      explanation: explanation,
      predicted_score: response.predicted_score, // 0-100
      approval_status: response.approval_status,
      grade_category: response.grade_category
    };
  } catch (error: any) {
    if (error.message?.includes('Dados inválidos')) {
      console.error('ML Service Validation Error');
      throw new Error(`Dados inválidos para o serviço de ML: ${error.message}`);
    }
    if (error.message?.includes('Timeout')) {
      throw new Error('Timeout ao processar predição de ML');
    }
    if (error.message?.includes('indisponível') || error.message?.includes('não encontrado')) {
      throw new Error('Serviço de ML indisponível');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao chamar serviço de ML');
  }
}

/**
 * Salva um desempenho baseado em uma predição de desempenho
 */
export async function saveDesempenho(
  IDMatricula: string,
  IDPrediction: string,
  mlResponse: MLPredictionResponse
) {
  // Calcular nota prevista (0-10) e percentual (0-100)
  const predictedScore = mlResponse.predicted_score !== undefined 
    ? mlResponse.predicted_score 
    : mlResponse.probability * 100;
  
  const notaPrevista = predictedScore / 10; // Converter de 0-100 para 0-10
  const notaPercentual = predictedScore; // Manter em 0-100
  
  // Determinar categoria da nota baseado no predicted_score
  let categoriaNota: string | null = null;
  if (predictedScore >= 90) categoriaNota = 'EXCELENTE';
  else if (predictedScore >= 80) categoriaNota = 'MUITO_BOM';
  else if (predictedScore >= 70) categoriaNota = 'BOM';
  else if (predictedScore >= 60) categoriaNota = 'SUFICIENTE';
  else categoriaNota = 'INSUFICIENTE';
  
  // Determinar status de aprovação
  let statusAprovacao: string | null = null;
  if (mlResponse.approval_status) {
    statusAprovacao = mlResponse.approval_status.toLowerCase() === 'approved' ? 'aprovado' : 'reprovado';
  } else {
    // Se não tiver approval_status, usar probabilidade
    statusAprovacao = mlResponse.probability >= 0.7 ? 'aprovado' : 
                     mlResponse.probability >= 0.5 ? 'em risco' : 'reprovado';
  }
  
  // Normalizar classificação
  const classificacao = mlResponse.prediction || mlResponse.grade_category || 'desconhecido';
  
  const desempenho = await prisma.desempenho.create({
    data: {
      IDMatricula,
      IDPrediction,
      NotaPrevista: Math.round(notaPrevista * 100) / 100, // Arredondar para 2 casas decimais
      NotaPercentual: Math.round(notaPercentual * 100) / 100,
      Classificacao: classificacao,
      Probabilidade: mlResponse.probability,
      StatusAprovacao: statusAprovacao,
      CategoriaNota: categoriaNota,
      Observacoes: mlResponse.explanation || null
    },
    include: {
      matricula: {
        include: {
          disciplina: true,
          periodo: true,
          aluno: {
            select: {
              IDAluno: true,
              Nome: true,
              IDUser: true
            }
          }
        }
      },
      prediction: true
    }
  });
  
  return desempenho;
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

  const prediction = await prisma.prediction.create({
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

  // Se for predição de desempenho, criar registro de desempenho
  if (tipo === TipoPredicao.DESEMPENHO) {
    try {
      const desempenho = await saveDesempenho(IDMatricula, prediction.IDPrediction, mlResponse);
      
      if (!desempenho) {
        console.error('Erro: Desempenho retornou null após salvar');
        throw new Error('Falha ao salvar desempenho - retorno vazio');
      }
      
      // Verificar se foi salvo corretamente fazendo uma query
      const desempenhoVerificado = await prisma.desempenho.findUnique({
        where: { IDDesempenho: desempenho.IDDesempenho },
        include: {
          matricula: {
            include: {
              disciplina: true,
              aluno: {
                select: {
                  IDUser: true,
                  Nome: true
                }
              }
            }
          }
        }
      });
      
      if (desempenhoVerificado) {
        // Criar notificação para o aluno
        if (desempenhoVerificado.matricula?.aluno?.IDUser) {
          try {
            await notificarNovaPredicaoDesempenho(
              desempenhoVerificado.matricula.aluno.IDUser,
              desempenhoVerificado.matricula.disciplina.NomeDaDisciplina,
              desempenhoVerificado.NotaPrevista,
              IDMatricula
            );
          } catch (notifError) {
            console.error('Erro ao criar notificação de desempenho:', notifError);
            // Não falhar a predição se houver erro ao criar notificação
          }
        }
      } else {
        console.error('Erro: Desempenho não encontrado no banco após salvar');
      }

      // Notificar professores se o desempenho for baixo (< 6.0)
      if (desempenhoVerificado && desempenhoVerificado.NotaPrevista < 6.0 && desempenhoVerificado.matricula?.aluno) {
        try {
          await notificarProfessorBaixoDesempenho(
            desempenhoVerificado.matricula.disciplina.IDDisciplina,
            desempenhoVerificado.matricula.aluno.Nome || 'Aluno',
            desempenhoVerificado.matricula.disciplina.NomeDaDisciplina,
            desempenhoVerificado.NotaPrevista,
            IDMatricula
          );
        } catch (notifError) {
          console.error('⚠️ Erro ao notificar professores sobre baixo desempenho:', notifError);
        }
      }

      // Notificar professores que um formulário foi completado
      if (desempenhoVerificado && desempenhoVerificado.matricula?.aluno) {
        try {
          await notificarProfessorFormularioCompleto(
            desempenhoVerificado.matricula.disciplina.IDDisciplina,
            desempenhoVerificado.matricula.aluno.Nome || 'Aluno',
            desempenhoVerificado.matricula.disciplina.NomeDaDisciplina,
            'DESEMPENHO',
            IDMatricula
          );
        } catch (notifError) {
          console.error('⚠️ Erro ao notificar professores sobre formulário completo:', notifError);
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar desempenho');
      // Não falhar a predição se houver erro ao salvar desempenho
    }
  } else if (tipo === TipoPredicao.EVASAO) {
    // Criar notificação para predição de evasão
    try {
      if (prediction.matricula && prediction.matricula.aluno) {
        const risco = mlResponse.probability < 0.33 ? 'baixo' : 
                      mlResponse.probability < 0.66 ? 'médio' : 'alto';
        
        // Notificar o aluno
        await notificarNovaPredicaoEvasao(
          prediction.matricula.aluno.IDUser,
          prediction.matricula.disciplina.NomeDaDisciplina,
          risco,
          mlResponse.probability,
          IDMatricula
        );

        // Notificar professores se o risco for médio ou alto
        if (mlResponse.probability >= 0.4) {
          await notificarProfessorAltoRiscoEvasao(
            prediction.matricula.disciplina.IDDisciplina,
            prediction.matricula.aluno.Nome,
            prediction.matricula.disciplina.NomeDaDisciplina,
            risco,
            mlResponse.probability,
            IDMatricula
          );
        }

        // Notificar professores que um formulário foi completado
        await notificarProfessorFormularioCompleto(
          prediction.matricula.disciplina.IDDisciplina,
          prediction.matricula.aluno.Nome,
          prediction.matricula.disciplina.NomeDaDisciplina,
          'EVASAO',
          IDMatricula
        );
      }
    } catch (notifError) {
      console.error('⚠️ Erro ao criar notificação de evasão:', notifError);
      // Não falhar a predição se houver erro ao criar notificação
    }
  }

  return prediction;
}

export async function callMLService(
  tipoPredicao: 'EVASAO' | 'DESEMPENHO',
  dados: any
): Promise<MLPredictionResponse> {

  const response = tipoPredicao === 'EVASAO' 
    ? await callDropoutService(dados)
    : await callPerformanceService(dados);


  return response;
}