import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { AlunoHabitoCompletoSchema, AlunoHabitoBasicoSchema, EngajamentoEvasaoSchema, AlunoHabitoDesempenhoSchema } from '../validation/alunoHabitoSchemas'
import { mapToDropoutData, mapToPerformanceData, hasCompleteDropoutData } from '../service/habitoMapperService'
import { callMLService, savePrediction } from '../service/predictionService'
import { TipoPredicao } from '@prisma/client'

export class AlunoHabitoController {
  // GET /aluno-habitos - pega hábitos do aluno logado
  static async getOwnHabitos(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    try {
      // busca o aluno vinculado ao user logado
      const aluno = await prisma.aluno.findUnique({
        where: { IDUser: userId },
      })

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado para este usuário' })
      }

      const habito = await prisma.alunoHabito.findFirst({
        where: { IDAluno: aluno.IDAluno },
      })

      return res.json(habito || {})
    } catch (error) {
      console.error('Erro ao buscar hábitos:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  // POST /aluno-habitos - cria ou atualiza hábitos do próprio aluno
  // Aceita tanto campos básicos quanto campos completos
  static async createOrUpdateOwnHabitos(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    try {
      // Validação com Zod - aceita campos opcionais
      const validationResult = AlunoHabitoCompletoSchema.safeParse(req.body)
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: validationResult.error.issues
        })
      }

      const dados = validationResult.data

      // encontra aluno vinculado ao usuário logado
      const aluno = await prisma.aluno.findUnique({
        where: { IDUser: userId },
      })

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado para este usuário' })
      }

      // verifica se já existe hábito
      const existing = await prisma.alunoHabito.findFirst({
        where: { IDAluno: aluno.IDAluno },
      })

      let habito
      if (existing) {
        // Atualiza apenas os campos fornecidos (merge com dados existentes)
        habito = await prisma.alunoHabito.update({
          where: { IDHabito: existing.IDHabito },
          data: dados as any,
        })
      } else {
        // Cria novo hábito
        habito = await prisma.alunoHabito.create({
          data: { 
            IDAluno: aluno.IDAluno,
            ...dados
          } as any,
        })
      }

      return res.json(habito)
    } catch (error) {
      console.error('Erro ao salvar hábito:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  // POST /aluno-habitos/predict/dropout - Envia dados de engajamento e recebe predição de evasão
  static async predictDropout(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    try {
      // Valida dados de engajamento
      const validationResult = EngajamentoEvasaoSchema.safeParse(req.body)
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: validationResult.error.issues
        })
      }

      const dadosEngajamento = validationResult.data

      // Busca o aluno
      const aluno = await prisma.aluno.findUnique({
        where: { IDUser: userId },
        include: {
          matriculas: {
            where: {
              periodo: { Ativo: true }
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado para este usuário' })
      }

      if (aluno.matriculas.length === 0) {
        return res.status(400).json({ error: 'Aluno não possui matrícula ativa' })
      }

      const matricula = aluno.matriculas[0]

      // Salva ou atualiza os dados de engajamento nos hábitos
      const existing = await prisma.alunoHabito.findFirst({
        where: { IDAluno: aluno.IDAluno },
      })

      let habito
      if (existing) {
        habito = await prisma.alunoHabito.update({
          where: { IDHabito: existing.IDHabito },
          data: dadosEngajamento as any,
        })
      } else {
        habito = await prisma.alunoHabito.create({
          data: { 
            IDAluno: aluno.IDAluno,
            horasEstudo: 0, // Valores padrão mínimos
            sono: 0,
            motivacao: 0,
            frequencia: 0,
            ...dadosEngajamento
          } as any,
        })
      }

      // Mapeia para formato do ML
      const mlData = mapToDropoutData(habito)

      // Chama o serviço de ML
      let mlResponse
      try {
        mlResponse = await callMLService('EVASAO', mlData)
      } catch (error: any) {
        if (error.message?.includes('indisponível') || error.message?.includes('Timeout')) {
          return res.status(503).json({ 
            error: 'Serviço de predição temporariamente indisponível',
            message: error.message
          })
        }
        if (error.message?.includes('Dados inválidos')) {
          return res.status(422).json({ 
            error: 'Dados inválidos para o modelo de ML',
            message: error.message
          })
        }
        throw error
      }

      // Salva a predição
      const prediction = await savePrediction(
        matricula.IDMatricula,
        TipoPredicao.EVASAO,
        mlResponse,
        mlData
      )

      // Retorna resultado visual
      const risco = mlResponse.probability < 0.33 ? 'baixo' : 
                    mlResponse.probability < 0.66 ? 'médio' : 'alto'

      return res.json({
        success: true,
        prediction: {
          IDPrediction: prediction.IDPrediction,
          risco: risco,
          probabilidade: Math.round(mlResponse.probability * 100),
          classificacao: mlResponse.prediction,
          explicacao: mlResponse.explanation,
          createdAt: prediction.createdAt
        },
        dadosEnviados: mlData
      })
    } catch (error: any) {
      console.error('Erro ao gerar predição de evasão:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
      })
    }
  }

  // POST /aluno-habitos/predict/performance - Envia dados de hábitos e recebe predição de desempenho
  static async predictPerformance(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    try {
      // Valida dados de hábitos (aceita campos básicos ou completos)
      const validationResult = AlunoHabitoCompletoSchema.safeParse(req.body)
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: validationResult.error.issues
        })
      }

      const dadosHabitos = validationResult.data

      // Busca o aluno
      const aluno = await prisma.aluno.findUnique({
        where: { IDUser: userId },
        include: {
          matriculas: {
            where: {
              periodo: { Ativo: true }
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado para este usuário' })
      }

      if (aluno.matriculas.length === 0) {
        return res.status(400).json({ error: 'Aluno não possui matrícula ativa' })
      }

      const matricula = aluno.matriculas[0]

      // Valida campos básicos obrigatórios
      if (dadosHabitos.horasEstudo === null || dadosHabitos.horasEstudo === undefined) {
        return res.status(400).json({ error: 'Campo obrigatório: horasEstudo' })
      }
      if (dadosHabitos.sono === null || dadosHabitos.sono === undefined) {
        return res.status(400).json({ error: 'Campo obrigatório: sono' })
      }
      if (dadosHabitos.frequencia === null || dadosHabitos.frequencia === undefined) {
        return res.status(400).json({ error: 'Campo obrigatório: frequencia' })
      }

      // Salva ou atualiza os dados de hábitos
      const existing = await prisma.alunoHabito.findFirst({
        where: { IDAluno: aluno.IDAluno },
      })

      let habito
      if (existing) {
        // Merge com dados existentes
        habito = await prisma.alunoHabito.update({
          where: { IDHabito: existing.IDHabito },
          data: dadosHabitos,
        })
      } else {
        habito = await prisma.alunoHabito.create({
          data: { 
            IDAluno: aluno.IDAluno,
            ...dadosHabitos
          } as any,
        })
      }

      // Mapeia para formato do ML (exige todos os campos)
      let mlData
      try {
        mlData = mapToPerformanceData(habito)
      } catch (error: any) {
        return res.status(400).json({ 
          error: error.message || 'Campos obrigatórios não preenchidos',
          details: 'Por favor, preencha todos os campos na aba "Dados Adicionais" para obter uma predição precisa.'
        })
      }

      // Chama o serviço de ML
      let mlResponse
      try {
        mlResponse = await callMLService('DESEMPENHO', mlData)
      } catch (error: any) {
        if (error.message?.includes('indisponível') || error.message?.includes('Timeout')) {
          return res.status(503).json({ 
            error: 'Serviço de predição temporariamente indisponível',
            message: error.message
          })
        }
        if (error.message?.includes('Dados inválidos')) {
          return res.status(422).json({ 
            error: 'Dados inválidos para o modelo de ML',
            message: error.message
          })
        }
        throw error
      }

      // Salva a predição
      const prediction = await savePrediction(
        matricula.IDMatricula,
        TipoPredicao.DESEMPENHO,
        mlResponse,
        mlData
      )

      // Extrai informações da resposta do ML
      const predictedScore = typeof mlResponse.prediction === 'string' 
        ? parseFloat(mlResponse.prediction) || mlResponse.probability * 100
        : mlResponse.probability * 100

      return res.json({
        success: true,
        prediction: {
          IDPrediction: prediction.IDPrediction,
          notaPrevista: Math.round(predictedScore * 10) / 10,
          probabilidade: Math.round(mlResponse.probability * 100),
          classificacao: mlResponse.prediction,
          explicacao: mlResponse.explanation,
          createdAt: prediction.createdAt
        },
        dadosEnviados: mlData
      })
    } catch (error: any) {
      console.error('Erro ao gerar predição de desempenho:', error)
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
      })
    }
  }
}