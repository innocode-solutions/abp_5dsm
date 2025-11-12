import { Request, Response } from 'express'
import { prisma } from '../config/database'

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
  static async createOrUpdateOwnHabitos(req: Request, res: Response) {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const { horasEstudo, sono, motivacao, frequencia } = req.body

    // validação de campos obrigatórios
    if (
      horasEstudo == null ||
      sono == null ||
      motivacao == null ||
      frequencia == null
    ) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    // validação de limites (ex.: 0-12 horas, 0–10 motivação, 0–100 frequência)
    if (
      horasEstudo < 0 || horasEstudo > 12 ||
      sono < 0 || sono > 12 ||
      motivacao < 0 || motivacao > 10 ||
      frequencia < 0 || frequencia > 100
    ) {
      return res.status(400).json({ error: 'Um ou mais campos estão fora dos limites permitidos' })
    }

    try {
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
        habito = await prisma.alunoHabito.update({
          where: { IDHabito: existing.IDHabito },
          data: { horasEstudo, sono, motivacao, frequencia },
        })
      } else {
        habito = await prisma.alunoHabito.create({
          data: { IDAluno: aluno.IDAluno, horasEstudo, sono, motivacao, frequencia },
        })
      }

      return res.json(habito)
    } catch (error) {
      console.error('Erro ao salvar hábito:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
}