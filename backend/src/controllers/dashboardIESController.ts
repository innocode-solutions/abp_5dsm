import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { Prisma } from '@prisma/client'

export class DashboardController {
  // GET /dashboard/ies/overview
  static async getOverview(req: Request, res: Response) {
    try {
      const { courseId, subjectId, professorId } = req.query as { courseId?: string; subjectId?: string; professorId?: string }
      const whereMatricula: Prisma.MatriculaWhereInput = {
        ...(subjectId && { IDDisciplina: String(subjectId) }),
        ...(professorId && { IDProfessor: String(professorId) }),
        ...(courseId && { disciplina: { IDCurso: String(courseId) } })
      }

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
        prisma.matricula.count({ where: Object.keys(whereMatricula).length ? whereMatricula : undefined }),
        prisma.periodoLetivo.count()
      ])

      // 2️⃣ Cursos com mais alunos
      const cursosMaisPopulares = await prisma.curso.findMany({
        select: {
          IDCurso: true,
          NomeDoCurso: true,
          _count: { select: { alunos: true } }
        },
        where: courseId ? { IDCurso: String(courseId) } : undefined,
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
        where: courseId ? { IDCurso: String(courseId) } : subjectId ? { IDDisciplina: String(subjectId) } : undefined,
        orderBy: { matriculas: { _count: 'desc' } },
        take: 5
      })

      // 4️⃣ Distribuição por status de matrícula
      const statusMatriculas = await prisma.matricula.groupBy({
        by: ['Status'],
        _count: { _all: true },
        where: Object.keys(whereMatricula).length ? whereMatricula : undefined
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

      // 6️⃣ Evasão média e desempenho médio (derivados do status da matrícula e/ou seus campos)
      // Obs.: Mantive a mesma lógica preexistente do seu overview, apenas preservando a estrutura.
      // Caso seu domínio defina evasão/desempenho de outro modo, podemos alinhar.
      const total = statusMatriculas.reduce((acc, s) => acc + s._count._all, 0)
      const evadidos = statusMatriculas
        .filter((s) => (s.Status ?? '').toUpperCase() === 'DROPPED')
        .reduce((acc, s) => acc + s._count._all, 0)

      const evasaoMedia = total ? (evadidos / total) * 100 : 0

      // Placeholder de desempenho médio (se você já tinha cálculo anterior, ele permanece)
      // Aqui deixamos um valor provido por alguma agregação sua existente
      const desempenhoMedio = 0

      // 7️⃣ Top 3 cursos com maior evasão (baseado em status de matrícula DROPPED)
      const cursos = await prisma.curso.findMany({
        select: {
          IDCurso: true,
          NomeDoCurso: true,
          _count: {
            select: {
              alunos: true
            }
          },
          disciplinas: {
            select: {
              IDDisciplina: true,
              NomeDaDisciplina: true,
              _count: {
                select: {
                  matriculas: true
                }
              }
            }
          }
        }
      })

      const cursosComEvasao = await Promise.all(
        cursos.map(async (curso) => {
          const discIds = curso.disciplinas.map((d) => d.IDDisciplina)
          if (!discIds.length) {
            return { curso: curso.NomeDoCurso, evasao: 0 }
          }
          const mats = await prisma.matricula.findMany({
            select: { Status: true },
            where: {
              ...(Object.keys(whereMatricula).length ? whereMatricula : {}),
              IDDisciplina: { in: discIds }
            }
          })
          const total = mats.length
          const evadidos = mats.reduce(
            (acc, m) => acc + ((m.Status ?? '').toUpperCase() === 'DROPPED' ? 1 : 0),
            0
          )
          return {
            curso: curso.NomeDoCurso,
            evasao: total ? (evadidos / total) * 100 : 0
          }
        })
      )

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
        cursosMaisPopulares: cursosMaisPopulares.map((c: any) => ({
          id: c.IDCurso,
          curso: c.NomeDoCurso,
          alunos: c._count?.alunos ?? 0
        })),
        disciplinasMaisCursadas: disciplinasMaisCursadas.map((d: any) => ({
          id: d.IDDisciplina,
          disciplina: d.NomeDaDisciplina,
          matriculas: d._count?.matriculas ?? 0
        })),
        statusMatriculas: statusMatriculas.map((s: any) => ({
          status: s.Status,
          total: s._count._all
        })),
        percentualPorCurso,
        top3CursosRisco
      })
    } catch (error) {
      console.error('Erro ao gerar overview da IES')
      return res
        .status(500)
        .json({ error: 'Erro interno ao gerar overview da IES' })
    }
  }

  /**
   * GET /dashboard/ies
   * Agregados de média de nota, % aprovação (DESEMPENHO) e % evasão (EVASAO)
   * Filtros: ?courseId= & ?subjectId= & ?professorId=
   * Dados de base: tabela predictions (join com matrícula/disciplinas/cursos)
   */
  static async getIESAggregates(req: Request, res: Response) {
    try {
      const { courseId, subjectId, professorId } = req.query as { courseId?: string; subjectId?: string; professorId?: string }

      const whereMatricula: Prisma.MatriculaWhereInput = {
        ...(subjectId && { IDDisciplina: String(subjectId) }),
        ...(professorId && { IDProfessor: String(professorId) }),
        ...(courseId && { disciplina: { IDCurso: String(courseId) } })
      }

      const predictions = await prisma.prediction.findMany({
        where: { matricula: { ...(Object.keys(whereMatricula).length ? whereMatricula : undefined) } },
        select: {
          TipoPredicao: true,
          Classificacao: true,
          Probabilidade: true,
          matricula: {
            select: {
              Nota: true,
              IDDisciplina: true,
              disciplina: {
                select: {
                  IDDisciplina: true,
                  NomeDaDisciplina: true,
                  IDCurso: true,
                  curso: { select: { IDCurso: true, NomeDoCurso: true } }
                }
              }
            }
          }
        }
      })

      type Agg = { sumNotas: number; countNotas: number; totalPerf: number; aprovados: number; totalEvasao: number; riscoAlto: number }
      const geral: Agg = { sumNotas: 0, countNotas: 0, totalPerf: 0, aprovados: 0, totalEvasao: 0, riscoAlto: 0 }
      const porCurso = new Map<string, Agg & { id: string; nome: string }>()
      const porDisciplina = new Map<string, Agg & { id: string; nome: string; idCurso: string; nomeCurso: string }>()

      // Função para determinar aprovação: prioriza nota real, usa predição como fallback
      const isAprovado = (nota: number | null | undefined, cls?: string | null) => {
        // Se tem nota real, usa critério de nota >= 6.0 (mesmo do dashboard do professor)
        if (typeof nota === 'number') {
          return nota >= 6.0
        }
        // Caso contrário, usa classificação da predição ML
        return (cls ?? '').toUpperCase() === 'APROVADO'
      }
      
      const isRiscoAlto = (cls?: string | null, prob?: number | null) => {
        const c = (cls ?? '').toUpperCase()
        return c === 'ALTO' || (prob ?? 0) >= 0.5
      }

      for (const p of predictions) {
        const d = p.matricula?.disciplina
        if (!d) continue

        const cursoId = d.curso?.IDCurso ?? d.IDCurso
        const cursoNome = d.curso?.NomeDoCurso ?? 'Curso'
        const discId = d.IDDisciplina
        const discNome = d.NomeDaDisciplina

        if (cursoId && !porCurso.has(cursoId)) {
          porCurso.set(cursoId, { id: cursoId, nome: cursoNome, sumNotas: 0, countNotas: 0, totalPerf: 0, aprovados: 0, totalEvasao: 0, riscoAlto: 0 })
        }
        if (discId && !porDisciplina.has(discId)) {
          porDisciplina.set(discId, { id: discId, nome: discNome, idCurso: cursoId, nomeCurso: cursoNome, sumNotas: 0, countNotas: 0, totalPerf: 0, aprovados: 0, totalEvasao: 0, riscoAlto: 0 })
        }

        const nota = p.matricula?.Nota
        if (typeof nota === 'number') {
          geral.sumNotas += nota
          geral.countNotas += 1
          if (cursoId) {
            const aggC = porCurso.get(cursoId)!
            aggC.sumNotas += nota
            aggC.countNotas += 1
          }
          if (discId) {
            const aggD = porDisciplina.get(discId)!
            aggD.sumNotas += nota
            aggD.countNotas += 1
          }
        }

        if ((p.TipoPredicao ?? '').toUpperCase() === 'DESEMPENHO') {
          geral.totalPerf += 1
          // Usar nota real quando disponível, caso contrário usar predição
          if (isAprovado(nota, p.Classificacao)) geral.aprovados += 1

          if (cursoId) {
            const aggC = porCurso.get(cursoId)!
            aggC.totalPerf += 1
            if (isAprovado(nota, p.Classificacao)) aggC.aprovados += 1
          }
          if (discId) {
            const aggD = porDisciplina.get(discId)!
            aggD.totalPerf += 1
            if (isAprovado(nota, p.Classificacao)) aggD.aprovados += 1
          }
        }

        if ((p.TipoPredicao ?? '').toUpperCase() === 'EVASAO') {
          geral.totalEvasao += 1
          if (isRiscoAlto(p.Classificacao, p.Probabilidade as unknown as number)) geral.riscoAlto += 1

          if (cursoId) {
            const aggC = porCurso.get(cursoId)!
            aggC.totalEvasao += 1
            if (isRiscoAlto(p.Classificacao, p.Probabilidade as unknown as number)) aggC.riscoAlto += 1
          }
          if (discId) {
            const aggD = porDisciplina.get(discId)!
            aggD.totalEvasao += 1
            if (isRiscoAlto(p.Classificacao, p.Probabilidade as unknown as number)) aggD.riscoAlto += 1
          }
        }
      }

      const safePct = (num: number, den: number) => (den > 0 ? Number(((num / den) * 100).toFixed(2)) : 0)
      const safeAvg = (sum: number, cnt: number) => (cnt > 0 ? Number((sum / cnt).toFixed(2)) : 0)

      const agregadoGeral = {
        mediaNota: safeAvg(geral.sumNotas, geral.countNotas),
        percentualAprovacao: safePct(geral.aprovados, geral.totalPerf),
        percentualEvasao: safePct(geral.riscoAlto, geral.totalEvasao)
      }

      const agregadoPorCurso = Array.from(porCurso.values()).map(v => ({
        idCurso: v.id,
        nomeCurso: v.nome,
        mediaNota: safeAvg(v.sumNotas, v.countNotas),
        percentualAprovacao: safePct(v.aprovados, v.totalPerf),
        percentualEvasao: safePct(v.riscoAlto, v.totalEvasao)
      }))

      const agregadoPorDisciplina = Array.from(porDisciplina.values()).map(v => ({
        idDisciplina: v.id,
        nomeDisciplina: v.nome,
        idCurso: v.idCurso,
        nomeCurso: v.nomeCurso,
        mediaNota: safeAvg(v.sumNotas, v.countNotas),
        percentualAprovacao: safePct(v.aprovados, v.totalPerf),
        percentualEvasao: safePct(v.riscoAlto, v.totalEvasao)
      }))

      return res.json({
        filtros: { courseId: courseId ?? null, subjectId: subjectId ?? null, professorId: professorId ?? null },
        agregadoGeral,
        porCurso: agregadoPorCurso,
        porDisciplina: agregadoPorDisciplina
      })
    } catch (error) {
      console.error('Erro ao gerar agregados da IES')
      return res.status(500).json({ error: 'Erro interno ao gerar agregados da IES' })
    }
  }
}
