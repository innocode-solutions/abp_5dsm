import { Request, Response } from 'express'
import { prisma } from '../config/database'

export class DashboardController {
  // GET /dashboard/ies/overview
  static async getOverview(req: Request, res: Response) {
    try {
      // 1️⃣ Contagens gerais
      const [
        totalCursos,
        totalDisciplinas,
        totalAlunos,
        totalMatriculas,
        totalPeriodos
      ] = await Promise.all([
        prisma.curso.count(),
        prisma.disciplina.count(),
        prisma.aluno.count(),
        prisma.matricula.count(),
        prisma.periodoLetivo.count()
      ])

      // 2️⃣ Cursos com mais alunos
      const cursosMaisPopulares = await prisma.curso.findMany({
        select: {
          IDCurso: true,
          NomeDoCurso: true,
          _count: { select: { alunos: true } }
        },
        orderBy: { alunos: { _count: 'desc' } },
        take: 5
      })

      // 3️⃣ Disciplinas mais cursadas
      const disciplinasMaisCursadas = await prisma.disciplina.findMany({
        select: {
          IDDisciplina: true,
          NomeDaDisciplina: true,
          _count: { select: { matriculas: true } }
        },
        orderBy: { matriculas: { _count: 'desc' } },
        take: 5
      })

      // 4️⃣ Distribuição por status de matrícula
      const statusMatriculas = await prisma.matricula.groupBy({
        by: ['Status'],
        _count: { _all: true }
      })

      // 5️⃣ Percentual de alunos por curso
      const alunosPorCurso = await prisma.curso.findMany({
        select: {
          NomeDoCurso: true,
          _count: { select: { alunos: true } }
        }
      })

      const totalAlunosGeral = alunosPorCurso.reduce(
        (acc: number, c: { _count: { alunos: number } | null }) =>
          acc + (c._count?.alunos ?? 0),
        0
      )

      const percentualPorCurso = alunosPorCurso.map((c: { NomeDoCurso: string; _count: { alunos: number } | null }) => ({
        curso: c.NomeDoCurso,
        alunos: c._count?.alunos ?? 0,
        percentual: totalAlunosGeral
          ? (((c._count?.alunos ?? 0) / totalAlunosGeral) * 100).toFixed(1)
          : '0.0'
      }))

      // 6️⃣ Evasão média
      const totalEvasao =
        statusMatriculas.find((s: { Status: string }) => s.Status === 'DROPPED')?._count?._all ?? 0
      const evasaoMedia = totalAlunosGeral
        ? (totalEvasao / totalAlunosGeral) * 100
        : 0

      // 7️⃣ Desempenho médio (placeholder)
      let desempenhoMedio: number | null = null

      // 8️⃣ Top 3 cursos em risco (maior evasão)
      const cursosEmRisco = await prisma.curso.findMany({
        select: {
          NomeDoCurso: true,
          alunos: {
            select: {
              matriculas: {
                select: { Status: true }
              }
            }
          }
        }
      })

      const cursosComEvasao = cursosEmRisco.map((curso: {
        NomeDoCurso: string
        alunos: { matriculas: { Status: string }[] }[]
      }) => {
        const total = curso.alunos.length
        const evadidos = curso.alunos.reduce(
          (acc: number, aluno: { matriculas: { Status: string }[] }) => {
            const drops = aluno.matriculas.filter(
              (m: { Status: string }) => m.Status === 'DROPPED'
            ).length
            return acc + drops
          },
          0
        )
        return {
          curso: curso.NomeDoCurso,
          evasao: total ? (evadidos / total) * 100 : 0
        }
      })

      const top3CursosRisco = cursosComEvasao
        .sort((a: { evasao: number }, b: { evasao: number }) => b.evasao - a.evasao)
        .slice(0, 3)

      // 🔹 Resposta final
      return res.json({
        resumo: {
          totalCursos,
          totalDisciplinas,
          totalAlunos,
          totalMatriculas,
          totalPeriodos,
          evasaoMedia: evasaoMedia.toFixed(1),
          desempenhoMedio
        },
        cursosMaisPopulares,
        disciplinasMaisCursadas,
        statusMatriculas,
        percentualPorCurso,
        top3CursosRisco
      })
    } catch (error) {
      console.error('Erro ao gerar overview da IES:', error)
      return res
        .status(500)
        .json({ error: 'Erro interno ao gerar overview da IES' })
    }
  }
}