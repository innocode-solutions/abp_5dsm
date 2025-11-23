/**
 * Serviço para gerar feedbacks formatados a partir de predições
 * Reutiliza a lógica do frontend para manter consistência
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FeedbackFeature {
  feature: string;
  value: string | number;
  influence: 'positiva' | 'negativa';
}

export interface FormattedFeedback {
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
 * Gera feedback formatado a partir de uma predição
 * Por enquanto, retorna dados básicos - a formatação completa é feita no frontend
 */
export async function getFormattedFeedback(predictionId: string): Promise<FormattedFeedback | null> {
  try {
    const prediction = await prisma.prediction.findUnique({
      where: { IDPrediction: predictionId },
      include: {
        matricula: {
          include: {
            disciplina: true,
          },
        },
        desempenho: {
          select: {
            NotaPrevista: true,
            NotaPercentual: true,
          },
        },
      },
    });

    if (!prediction) {
      return null;
    }

    // Buscar NotaPrevista e NotaPercentual (predicted_score) do desempenho se for predição de DESEMPENHO
    let notaPrevista: number | undefined;
    let predictedScore: number | undefined;
    if (prediction.TipoPredicao === 'DESEMPENHO' && prediction.desempenho) {
      notaPrevista = prediction.desempenho.NotaPrevista;
      predictedScore = prediction.desempenho.NotaPercentual; // NotaPercentual é o predicted_score (0-100)
    }

    // Por enquanto, retorna estrutura básica
    // A formatação completa será feita no frontend usando FeedbackService
    return {
      IDPrediction: prediction.IDPrediction,
      tipo: prediction.TipoPredicao,
      disciplina: prediction.matricula.disciplina.NomeDaDisciplina,
      title: prediction.TipoPredicao === 'DESEMPENHO' 
        ? 'Feedback sobre sua Predição de Desempenho'
        : 'Feedback sobre seu Risco de Evasão',
      message: prediction.Explicacao || 'Sem explicação disponível',
      features: [],
      suggestions: [],
      data: prediction.createdAt.toISOString(),
      probabilidade: prediction.Probabilidade,
      classificacao: prediction.Classificacao,
      notaPrevista: notaPrevista,
      predicted_score: predictedScore, // Nota em escala 0-100 para lógica de cores/notificações
    };
  } catch (error) {
    console.error('Erro ao gerar feedback formatado');
    return null;
  }
}

/**
 * Busca todos os feedbacks formatados de um aluno
 */
export async function getStudentFeedbacks(studentId: string): Promise<FormattedFeedback[]> {
  try {
    const aluno = await prisma.aluno.findUnique({
      where: { IDAluno: studentId },
      include: {
        matriculas: {
          include: {
            disciplina: true,
            predictions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!aluno) {
      return [];
    }

    // Buscar todos os desempenhos de uma vez para melhor performance
    const predictionIds = aluno.matriculas.flatMap(m => 
      m.predictions.filter(p => p.TipoPredicao === 'DESEMPENHO').map(p => p.IDPrediction)
    );
    
    const desempenhos = predictionIds.length > 0
      ? await prisma.desempenho.findMany({
          where: { IDPrediction: { in: predictionIds } },
          select: { IDPrediction: true, NotaPrevista: true, NotaPercentual: true },
        })
      : [];
    
    // Criar mapas de IDPrediction -> NotaPrevista e NotaPercentual (predicted_score)
    const desempenhoNotaMap = new Map(
      desempenhos.map(d => [d.IDPrediction, d.NotaPrevista])
    );
    const desempenhoScoreMap = new Map(
      desempenhos.map(d => [d.IDPrediction, d.NotaPercentual])
    );

    const feedbacks: FormattedFeedback[] = [];

    aluno.matriculas.forEach((matricula) => {
      matricula.predictions.forEach((prediction) => {
        // Buscar NotaPrevista e predicted_score do desempenho se for predição de DESEMPENHO
        const notaPrevista = prediction.TipoPredicao === 'DESEMPENHO'
          ? desempenhoNotaMap.get(prediction.IDPrediction)
          : undefined;
        const predictedScore = prediction.TipoPredicao === 'DESEMPENHO'
          ? desempenhoScoreMap.get(prediction.IDPrediction)
          : undefined;

        feedbacks.push({
          IDPrediction: prediction.IDPrediction,
          tipo: prediction.TipoPredicao,
          disciplina: matricula.disciplina.NomeDaDisciplina,
          title: prediction.TipoPredicao === 'DESEMPENHO' 
            ? 'Feedback sobre sua Predição de Desempenho'
            : 'Feedback sobre seu Risco de Evasão',
          message: prediction.Explicacao || 'Sem explicação disponível',
          features: [],
          suggestions: [],
          data: prediction.createdAt.toISOString(),
          probabilidade: prediction.Probabilidade,
          classificacao: prediction.Classificacao,
          notaPrevista: notaPrevista,
          predicted_score: predictedScore, // Nota em escala 0-100 para lógica de cores/notificações
        });
      });
    });

    // Ordenar por data (mais recentes primeiro)
    feedbacks.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    return feedbacks;
  } catch (error) {
    console.error('Erro ao buscar feedbacks do aluno');
    return [];
  }
}

