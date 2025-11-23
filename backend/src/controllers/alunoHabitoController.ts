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

      if (!habito) {
        return res.json({})
      }

      // Filtrar campos null/undefined/vazios antes de retornar
      // Retornar apenas campos que têm valores reais
      const habitoLimpo: any = {
        IDHabito: habito.IDHabito,
        IDAluno: habito.IDAluno,
        createdAt: habito.createdAt,
        updatedAt: habito.updatedAt,
      }

      // Campos básicos (sempre incluir se não forem null)
      if (habito.horasEstudo !== null && habito.horasEstudo !== undefined) {
        habitoLimpo.horasEstudo = habito.horasEstudo
      }
      if (habito.sono !== null && habito.sono !== undefined) {
        habitoLimpo.sono = habito.sono
      }
      if (habito.motivacao !== null && habito.motivacao !== undefined) {
        habitoLimpo.motivacao = habito.motivacao
      }
      if (habito.frequencia !== null && habito.frequencia !== undefined) {
        habitoLimpo.frequencia = habito.frequencia
      }
      // Previous_Scores removido para evitar viés - não é mais necessário

      // Campos adicionais (incluir apenas se não forem null/undefined/vazios)
      const camposAdicionais = [
        'Distance_from_Home', 'Gender', 'Parental_Education_Level', 'Parental_Involvement',
        'School_Type', 'Peer_Influence', 'Extracurricular_Activities', 'Learning_Disabilities',
        'Internet_Access', 'Access_to_Resources', 'Teacher_Quality', 'Family_Income',
        'Motivation_Level', 'Tutoring_Sessions', 'Physical_Activity'
      ]

      camposAdicionais.forEach(campo => {
        const value = (habito as any)[campo]
        if (value !== null && value !== undefined && value !== '') {
          habitoLimpo[campo] = value
        }
      })

      // Campos de evasão (incluir apenas se não forem null/undefined)
      const camposEvasao = [
        'raisedhands', 'VisITedResources', 'AnnouncementsView', 'Discussion',
        'ParentAnsweringSurvey', 'ParentschoolSatisfaction', 'StudentAbsenceDays'
      ]

      camposEvasao.forEach(campo => {
        const value = (habito as any)[campo]
        if (value !== null && value !== undefined) {
          habitoLimpo[campo] = value
        }
      })


      return res.json(habitoLimpo)
    } catch (error) {
      console.error('Erro ao buscar hábitos')
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  // POST /aluno-habitos - cria ou atualiza hábitos do próprio aluno
  // Aceita tanto campos básicos quanto campos completos
  // IMPORTANTE: Não salva valores padrão genéricos - apenas campos realmente preenchidos
  static async createOrUpdateOwnHabitos(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    try {
      // Filtrar apenas campos vazios/null/undefined - NÃO filtrar valores válidos
      // Se o usuário escolheu um valor, mesmo que seja comum, deve ser salvo
      const dadosFiltrados: any = {}
      Object.keys(req.body).forEach(key => {
        const value = req.body[key]
        // Apenas incluir se o valor for válido (não null, não undefined, não string vazia)
        if (value !== null && value !== undefined && value !== '') {
          // Se for número, incluir sempre (mesmo que seja 0)
          if (typeof value === 'number') {
            dadosFiltrados[key] = value
          } 
          // Se for string, incluir apenas se não estiver vazia após trim
          else if (typeof value === 'string' && value.trim() !== '') {
            dadosFiltrados[key] = value.trim()
          }
        }
      })
      
      
      // Validação com Zod - aceita campos opcionais
      const validationResult = AlunoHabitoCompletoSchema.partial().safeParse(dadosFiltrados)
      
      if (!validationResult.success) {
        console.error('Erro de validação de dados')
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
        // IMPORTANTE: Usar dadosFiltrados diretamente, não dados (que pode ter sido modificado pelo Zod)
        // Isso garante que todos os valores enviados sejam atualizados
        const dadosParaAtualizar: any = {}
        
        // Usar dadosFiltrados (valores originais do req.body após filtrar vazios)
        // Não usar dados (que pode ter sido modificado pela validação do Zod)
        Object.keys(dadosFiltrados).forEach(key => {
          const value = dadosFiltrados[key]
          // Incluir todos os valores válidos que foram enviados
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'number') {
              // Aceitar números mesmo que sejam 0 (pode ser um valor válido)
              dadosParaAtualizar[key] = value
            } else if (typeof value === 'string' && value.trim() !== '') {
              dadosParaAtualizar[key] = value.trim()
            }
          }
        })
        
        if (Object.keys(dadosParaAtualizar).length > 0) {
          try {
            habito = await prisma.alunoHabito.update({
              where: { IDHabito: existing.IDHabito },
              data: dadosParaAtualizar as any,
            })
          } catch (updateError: any) {
            console.error('Erro ao atualizar hábitos')
            throw updateError
          }
        } else {
          habito = existing
        }
      } else {
        // Cria novo hábito apenas com campos realmente preenchidos
        // Filtrar novamente para garantir que não há campos vazios
        const dadosParaCriar: any = { IDAluno: aluno.IDAluno }
        Object.keys(dados).forEach(key => {
          const value = (dados as any)[key]
          if (value !== undefined && value !== null) {
            if (typeof value === 'number') {
              dadosParaCriar[key] = value
            } else if (typeof value === 'string' && value.trim() !== '') {
              dadosParaCriar[key] = value.trim()
            }
          }
        })
        
        habito = await prisma.alunoHabito.create({
          data: dadosParaCriar as any,
        })
      }

      return res.json(habito)
    } catch (error) {
      console.error('Erro ao salvar hábito')
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }

  // POST /aluno-habitos/predict/dropout - Usa dados da tabela aluno_habitos para predição de evasão
  static async predictDropout(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    try {
      // Verificar se IDMatricula foi fornecido no body ou query
      const requestedMatriculaId = req.body.IDMatricula || req.query.IDMatricula
      
      // Remover IDMatricula do body para não interferir no processamento dos hábitos
      const { IDMatricula, ...engagementDataBody } = req.body

      // Busca o aluno com matrículas incluindo disciplina e período
      const aluno = await prisma.aluno.findUnique({
        where: { IDUser: userId },
        include: {
          matriculas: {
            where: {
              periodo: { Ativo: true }
            },
            include: {
              disciplina: true,
              periodo: true
            },
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

      // Se IDMatricula foi fornecido, buscar essa matrícula específica
      let matricula
      if (requestedMatriculaId) {
        matricula = aluno.matriculas.find(m => m.IDMatricula === requestedMatriculaId)
        if (!matricula) {
          console.error('Matrícula não encontrada')
          return res.status(400).json({ 
            error: 'Matrícula não encontrada ou não pertence ao aluno',
            message: `A matrícula ${requestedMatriculaId} não foi encontrada para este aluno.`,
            matriculasDisponiveis: aluno.matriculas.map(m => ({
              id: m.IDMatricula,
              disciplina: m.disciplina.NomeDaDisciplina
            }))
          })
        }
      } else {
        // Comportamento padrão: usar a primeira matrícula ativa
        matricula = aluno.matriculas[0]
      }

      // Busca dados da tabela aluno_habitos
      let habito = await prisma.alunoHabito.findFirst({
        where: { IDAluno: aluno.IDAluno },
      })

      // Se não houver dados salvos, verifica se foram enviados na requisição para salvar
      if (!habito) {
        // Valida dados de engajamento se enviados (usar engagementDataBody sem IDMatricula)
        const validationResult = EngajamentoEvasaoSchema.safeParse(engagementDataBody)
        
        if (!validationResult.success) {
          return res.status(400).json({ 
            error: 'Dados não encontrados na tabela aluno_habitos e dados enviados são inválidos',
            details: validationResult.error.issues
          })
        }

        const dadosEngajamento = validationResult.data

        // Cria novo registro com os dados enviados
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
      } else {
        // Se há dados salvos, permite atualização opcional via requisição
        if (Object.keys(engagementDataBody).length > 0) {
          const validationResult = EngajamentoEvasaoSchema.safeParse(engagementDataBody)
          
          if (validationResult.success) {
            // Atualiza apenas os campos enviados
            habito = await prisma.alunoHabito.update({
              where: { IDHabito: habito.IDHabito },
              data: validationResult.data as any,
            })
          }
        }
      }

      // Mapeia para formato do ML usando dados da tabela aluno_habitos
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

      // Salva a predição na matrícula selecionada
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
          IDMatricula: matricula.IDMatricula,
          disciplina: matricula.disciplina.NomeDaDisciplina,
          risco: risco,
          probabilidade: Math.round(mlResponse.probability * 100),
          classificacao: mlResponse.prediction,
          explicacao: mlResponse.explanation,
          createdAt: prediction.createdAt
        },
        dadosEnviados: mlData
      })
    } catch (error: any) {
      console.error('Erro ao gerar predição de evasão')
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
      })
    }
  }

  // POST /aluno-habitos/predict/performance - Usa dados da tabela aluno_habitos para predição de desempenho
  static async predictPerformance(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    try {
      // Verificar se IDMatricula foi fornecido no body ou query
      const requestedMatriculaId = req.body.IDMatricula || req.query.IDMatricula
      
      // Remover IDMatricula do body para não interferir no processamento dos hábitos
      const { IDMatricula, ...habitDataBody } = req.body

      // Busca o aluno com matrículas incluindo disciplina e período
      const aluno = await prisma.aluno.findUnique({
        where: { IDUser: userId },
        include: {
          matriculas: {
            where: {
              periodo: { Ativo: true }
            },
            include: {
              disciplina: true,
              periodo: true
            },
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

      // Se IDMatricula foi fornecido, buscar essa matrícula específica
      let matricula
      if (requestedMatriculaId) {
        matricula = aluno.matriculas.find(m => m.IDMatricula === requestedMatriculaId)
        if (!matricula) {
          console.error('Matrícula não encontrada')
          return res.status(400).json({ 
            error: 'Matrícula não encontrada ou não pertence ao aluno',
            message: `A matrícula ${requestedMatriculaId} não foi encontrada para este aluno.`,
            matriculasDisponiveis: aluno.matriculas.map(m => ({
              id: m.IDMatricula,
              disciplina: m.disciplina.NomeDaDisciplina
            }))
          })
        }
      } else {
        // Comportamento padrão: usar a primeira matrícula ativa
        matricula = aluno.matriculas[0]
      }

      // Buscar dados salvos na tabela aluno_habitos (fonte principal)
      let habito = await prisma.alunoHabito.findFirst({
        where: { IDAluno: aluno.IDAluno },
      })

      // Se não houver dados salvos, verifica se foram enviados na requisição
      if (!habito) {
        // Filtrar apenas campos básicos obrigatórios e campos adicionais que foram realmente preenchidos
        // NÃO salvar valores padrão genéricos
        const camposParaSalvar: any = {}
        
        // Campos básicos obrigatórios (sempre salvar se presentes)
        const camposBasicos = ['horasEstudo', 'sono', 'motivacao', 'frequencia']
        // Previous_Scores removido para evitar viés
        camposBasicos.forEach(key => {
          if (habitDataBody[key] !== null && habitDataBody[key] !== undefined && habitDataBody[key] !== '') {
            camposParaSalvar[key] = habitDataBody[key]
          }
        })
        
        // Campos adicionais (apenas se preenchidos e não forem valores padrão genéricos)
        const camposAdicionais = [
          'Distance_from_Home', 'Gender', 'Parental_Education_Level', 'Parental_Involvement',
          'School_Type', 'Peer_Influence', 'Extracurricular_Activities', 'Learning_Disabilities',
          'Internet_Access', 'Access_to_Resources', 'Teacher_Quality', 'Family_Income',
          'Tutoring_Sessions', 'Physical_Activity', 'Motivation_Level'
        ]
        
        const valoresPadraoGenericos = [
          'Near', 'Male', 'High School', 'Medium', 'Public', 'Neutral', 
          'No', 'Yes', 'Average', 'Low', 'High'
        ]
        
        camposAdicionais.forEach(key => {
          const value = habitDataBody[key]
          if (value !== null && value !== undefined && value !== '') {
            // Apenas salvar se não for um valor padrão genérico
            if (!valoresPadraoGenericos.includes(String(value))) {
              camposParaSalvar[key] = value
            }
          }
        })
        
        // Validar apenas campos básicos obrigatórios
        if (!camposParaSalvar.horasEstudo || !camposParaSalvar.sono || !camposParaSalvar.frequencia) {
          return res.status(400).json({ 
            error: 'Campos básicos obrigatórios não encontrados: horasEstudo, sono, frequencia',
            message: 'Por favor, preencha os campos básicos antes de calcular o desempenho.'
          })
        }
        
        // Criar registro apenas com campos realmente preenchidos (não valores padrão)
        habito = await prisma.alunoHabito.create({
          data: { 
            IDAluno: aluno.IDAluno,
            ...camposParaSalvar
          } as any,
        })
      } else {
        // Se há dados salvos, permite atualização opcional via requisição
        // IMPORTANTE: Não salvar valores padrão ou campos vazios
        if (Object.keys(habitDataBody).length > 0) {
          // Filtrar apenas campos que têm valores reais (não vazios, não null, não undefined)
          const camposParaAtualizar: any = {}
          
          Object.keys(habitDataBody).forEach(key => {
            const value = habitDataBody[key]
            // Apenas incluir se o valor for válido (não vazio, não null, não undefined)
            if (value !== null && value !== undefined && value !== '') {
              // Verificar se não é um valor padrão genérico que não deveria ser salvo
              const defaultValues = [
                'Near', 'Male', 'High School', 'Medium', 'Public', 'Neutral', 
                'No', 'Yes', 'Average', 'Low', 'High'
              ]
              
              // Se o valor não está na lista de valores padrão genéricos, ou se é um número, salvar
              if (!defaultValues.includes(String(value)) || typeof value === 'number') {
                camposParaAtualizar[key] = value
              }
            }
          })
          
          // Apenas atualizar se houver campos válidos para atualizar
          if (Object.keys(camposParaAtualizar).length > 0) {
            
            // Validar apenas os campos que serão salvos
            const validationResult = AlunoHabitoCompletoSchema.partial().safeParse(camposParaAtualizar)
            
            if (validationResult.success) {
              // Atualiza apenas os campos válidos enviados (não salva valores padrão)
              habito = await prisma.alunoHabito.update({
                where: { IDHabito: habito.IDHabito },
                data: validationResult.data as any,
              })
            } else {
              // Alguns campos não passaram na validação, ignorando
            }
          }
        }
      }

      // Prepara dados combinados para mapeamento
      // IMPORTANTE: Dados do body (habitDataBody) SEMPRE sobrescrevem dados salvos (habito)
      // Isso garante que valores novos do formulário sejam usados, não valores antigos
      const dadosCombinados: any = {
        ...habito,
        // Sobrescreve com dados do body APENAS se forem fornecidos e não forem vazios
        ...Object.fromEntries(
          Object.entries(habitDataBody).filter(([, value]) => 
            value !== null && value !== undefined && value !== ''
          )
        )
      }

      // Remove campos que não são relevantes para o mapeamento
      delete dadosCombinados.IDHabito
      delete dadosCombinados.createdAt
      delete dadosCombinados.updatedAt


      // Valida campos básicos obrigatórios (da tabela aluno_habitos)
      if (dadosCombinados.horasEstudo === null || dadosCombinados.horasEstudo === undefined) {
        return res.status(400).json({ error: 'Campo obrigatório não encontrado na tabela aluno_habitos: horasEstudo' })
      }
      if (dadosCombinados.sono === null || dadosCombinados.sono === undefined) {
        return res.status(400).json({ error: 'Campo obrigatório não encontrado na tabela aluno_habitos: sono' })
      }
      if (dadosCombinados.frequencia === null || dadosCombinados.frequencia === undefined) {
        return res.status(400).json({ error: 'Campo obrigatório não encontrado na tabela aluno_habitos: frequencia' })
      }

      // Mapeia para formato do ML usando os dados da tabela aluno_habitos
      // IMPORTANTE: Valores padrão são aplicados APENAS para a predição ML
      // NÃO são salvos no banco de dados - apenas usados temporariamente para o cálculo
      let mlData
      try {
        const habitoForMapping: any = {
          ...dadosCombinados,
        }
        
        // Aplica valores padrão APENAS para campos adicionais que não foram preenchidos
        // Estes valores são usados SOMENTE para a predição ML, NÃO são salvos no banco
        const defaultValues = {
          Distance_from_Home: 'Near',
          Gender: 'Male',
          Parental_Education_Level: 'High School',
          Parental_Involvement: 'Medium',
          School_Type: 'Public',
          Peer_Influence: 'Neutral',
          Extracurricular_Activities: 'No',
          Learning_Disabilities: 'No',
          Internet_Access: 'Yes',
          Access_to_Resources: 'Average',
          Teacher_Quality: 'Average',
          Family_Income: 'Medium',
          Tutoring_Sessions: 'No',
          Physical_Activity: 'Medium',
        }
        
        // Aplica valores padrão apenas se o campo não estiver definido
        // IMPORTANTE: Estes valores são temporários, apenas para o ML, NÃO salvos no banco
        Object.keys(defaultValues).forEach(key => {
          if (habitoForMapping[key] === undefined || habitoForMapping[key] === null || habitoForMapping[key] === '') {
            habitoForMapping[key] = (defaultValues as any)[key]
          }
        })
        
        // Previous_Scores removido para evitar viés - o modelo não deve usar notas anteriores
        // Não é mais necessário definir valor padrão para Previous_Scores
        
        // Garante que motivacao tenha um valor válido (5 se não preenchido ou NaN)
        // Este valor é temporário, apenas para ML
        if (habitoForMapping.motivacao === undefined || habitoForMapping.motivacao === null || habitoForMapping.motivacao === '' || isNaN(Number(habitoForMapping.motivacao))) {
          habitoForMapping.motivacao = 5 // Valor médio padrão
        } else {
          // Garante que seja um número válido
          habitoForMapping.motivacao = Number(habitoForMapping.motivacao)
        }
        
        mlData = mapToPerformanceData(habitoForMapping)
      } catch (error: any) {
        console.error('Erro ao mapear dados para ML')
        return res.status(400).json({ 
          error: error.message || 'Campos obrigatórios não preenchidos na tabela aluno_habitos',
          details: 'Por favor, preencha todos os campos necessários na tabela aluno_habitos para obter uma predição.'
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

      // Salva a predição na matrícula selecionada
      const prediction = await savePrediction(
        matricula.IDMatricula,
        TipoPredicao.DESEMPENHO,
        mlResponse,
        mlData
      )

      // Buscar o desempenho salvo para confirmar
      const desempenhoSalvo = await prisma.desempenho.findUnique({
        where: { IDPrediction: prediction.IDPrediction },
        include: {
          matricula: {
            include: {
              disciplina: true,
              periodo: true
            }
          }
        }
      })


      // Extrai informações da resposta do ML
      // Usar predicted_score (0-100) se disponível, senão usar probability como fallback
      const predictedScore = mlResponse.predicted_score !== undefined 
        ? mlResponse.predicted_score 
        : (mlResponse.probability * 100)
      
      // Converter de 0-100 para 0-10 (escala do frontend)
      const notaPrevista = predictedScore / 10

      return res.json({
        success: true,
        prediction: {
          IDPrediction: prediction.IDPrediction,
          IDMatricula: matricula.IDMatricula,
          disciplina: matricula.disciplina.NomeDaDisciplina,
          notaPrevista: Math.round(notaPrevista * 100) / 100, // Arredondar para 2 casas decimais (0-10)
          predicted_score: Math.round(predictedScore * 100) / 100, // Nota em escala 0-100 para lógica de cores/notificações
          probabilidade: Math.round(mlResponse.probability * 100),
          classificacao: mlResponse.prediction,
          explicacao: mlResponse.explanation,
          createdAt: prediction.createdAt
        },
        desempenho: desempenhoSalvo ? {
          IDDesempenho: desempenhoSalvo.IDDesempenho,
          IDMatricula: desempenhoSalvo.IDMatricula,
          disciplina: desempenhoSalvo.matricula.disciplina.NomeDaDisciplina,
          NotaPrevista: desempenhoSalvo.NotaPrevista,
          Classificacao: desempenhoSalvo.Classificacao,
          StatusAprovacao: desempenhoSalvo.StatusAprovacao,
          CategoriaNota: desempenhoSalvo.CategoriaNota,
          createdAt: desempenhoSalvo.createdAt
        } : null,
        dadosEnviados: mlData
      })
    } catch (error: any) {
      console.error('Erro ao gerar predição de desempenho')
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message 
      })
    }
  }
}