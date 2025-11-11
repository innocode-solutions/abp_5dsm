import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class AlunoController {
  // GET /alunos - Get all students
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, cursoId, semestre } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: Prisma.AlunoWhereInput = {
        ...(search && {
          OR: [
            { Nome: { contains: String(search), mode: 'insensitive' } },
            { Email: { contains: String(search), mode: 'insensitive' } }
          ]
        }),
        ...(cursoId && { IDCurso: String(cursoId) }),
        ...(semestre && { Semestre: Number(semestre) })
      };

      const [alunos, total] = await Promise.all([
        prisma.aluno.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            curso: {
              select: {
                IDCurso: true,
                NomeDoCurso: true
              }
            },
            user: {
              select: {
                IDUser: true,
                Email: true,
                Role: true
              }
            },
            _count: {
              select: {
                matriculas: true
              }
            }
          },
          orderBy: { Nome: 'asc' }
        }),
        prisma.aluno.count({ where })
      ]);

      res.json({
        data: alunos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /alunos/:id - Get student by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const aluno = await prisma.aluno.findUnique({
        where: { IDAluno: id },
        include: {
          curso: true,
          user: {
            select: {
              IDUser: true,
              Email: true,
              Role: true,
              name: true
            }
          },
          matriculas: {
            include: {
              disciplina: {
                select: {
                  IDDisciplina: true,
                  NomeDaDisciplina: true,
                  CodigoDaDisciplina: true,
                  CargaHoraria: true
                }
              },
              periodo: {
                select: {
                  IDPeriodo: true,
                  Nome: true,
                  DataInicio: true,
                  DataFim: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              matriculas: true
            }
          }
        }
      });

      if (!aluno) {
        return res.status(404).json({ error: 'Student not found' });
      }

      res.json(aluno);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /alunos - Create new student
  static async create(req: Request, res: Response) {
    try {
      const { Nome, Email, Idade, IDCurso, IDUser, Semestre } = req.body;

      if (!Nome || !Email || !IDCurso || !IDUser) {
        return res.status(400).json({ error: 'Name, email, course ID, and user ID are required' });
      }

      // Verify course exists
      const curso = await prisma.curso.findUnique({
        where: { IDCurso }
      });

      if (!curso) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { IDUser }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const aluno = await prisma.aluno.create({
        data: {
          Nome,
          Email,
          Idade,
          IDCurso,
          IDUser,
          Semestre
        },
        include: {
          curso: {
            select: {
              IDCurso: true,
              NomeDoCurso: true
            }
          },
          user: {
            select: {
              IDUser: true,
              Email: true,
              Role: true
            }
          },
          _count: {
            select: {
              matriculas: true
            }
          }
        }
      });

      res.status(201).json(aluno);
    } catch (error) {
      console.error('Error creating student:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Email or user ID already exists' });
        }
        if (error.code === 'P2003') {
          return res.status(400).json({ error: 'Invalid user ID' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /alunos/:id - Update student
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { Nome, Email, Idade, IDCurso, Semestre } = req.body;

      // If course is being updated, verify it exists
      if (IDCurso) {
        const curso = await prisma.curso.findUnique({
          where: { IDCurso }
        });

        if (!curso) {
          return res.status(404).json({ error: 'Course not found' });
        }
      }

      const aluno = await prisma.aluno.update({
        where: { IDAluno: id },
        data: {
          Nome,
          Email,
          Idade,
          IDCurso,
          Semestre
        },
        include: {
          curso: {
            select: {
              IDCurso: true,
              NomeDoCurso: true
            }
          },
          _count: {
            select: {
              matriculas: true
            }
          }
        }
      });

      res.json(aluno);
    } catch (error) {
      console.error('Error updating student:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Student not found' });
        }
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /alunos/:id - Delete student
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.aluno.delete({
        where: { IDAluno: id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting student:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Student not found' });
        }
        if (error.code === 'P2003') {
          return res.status(409).json({ error: 'Cannot delete student with associated enrollments' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /alunos/curso/:cursoId - Get students by course
  static async getByCourse(req: Request, res: Response) {
    try {
      const { cursoId } = req.params;
      const { semestre } = req.query;

      const where: Prisma.AlunoWhereInput = {
        IDCurso: cursoId,
        ...(semestre && { Semestre: Number(semestre) })
      };

      const alunos = await prisma.aluno.findMany({
        where,
        include: {
          _count: {
            select: {
              matriculas: true
            }
          }
        },
        orderBy: { Nome: 'asc' }
      });

      res.json(alunos);
    } catch (error) {
      console.error('Error fetching students by course:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /alunos/:id/matriculas - Get student enrollments
  static async getEnrollments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, periodoId } = req.query;

      const where: Prisma.MatriculaWhereInput = {
        IDAluno: id,
        ...(status && { Status: status as any }),
        ...(periodoId && { IDPeriodo: String(periodoId) })
      };

      const matriculas = await prisma.matricula.findMany({
        where,
        include: {
          disciplina: {
            select: {
              IDDisciplina: true,
              NomeDaDisciplina: true,
              CodigoDaDisciplina: true,
              CargaHoraria: true
            }
          },
          periodo: {
            select: {
              IDPeriodo: true,
              Nome: true,
              DataInicio: true,
              DataFim: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(matriculas);
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /alunos/:id/disciplinas - Get subjects by student
static async getSubjectsByStudent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Busca o aluno e suas matrículas (com disciplina e período)
    const aluno = await prisma.aluno.findUnique({
      where: { IDAluno: id },
      include: {
        matriculas: {
          where: {
            periodo: { Ativo: true }, // apenas período letivo ativo
          },
          include: {
            disciplina: true,
            periodo: true,
          },
        },
      },
    });

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }

    // Monta a resposta padronizada
    const subjects = aluno.matriculas.map((matricula: { disciplina: { NomeDaDisciplina: any; }; periodo: { Nome: any; }; }) => ({
      IDAluno: aluno.IDAluno,
      Nome: aluno.Nome,
      NomeDaDisciplina: matricula.disciplina.NomeDaDisciplina,
      PeriodoLetivo: matricula.periodo.Nome,
    }));

    return res.json(subjects);
  } catch (error) {
    console.error('Erro ao buscar disciplinas do aluno:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar disciplinas.' });
  }
 }

  // GET /alunos/class/:subjectId - Get students by class and their predictions
 static async getStudentsByClassSubject(req: Request, res: Response) {
    try {
      const { subjectId } = req.params;
      const { periodoId, activeOnly = 'true' } = req.query as {
        periodoId?: string;
        activeOnly?: 'true' | 'false';
      };

      // 1) valida disciplina
      const disciplina = await prisma.disciplina.findUnique({
        where: { IDDisciplina: subjectId },
        select: { IDDisciplina: true, NomeDaDisciplina: true }
      });

      if (!disciplina) {
        return res.status(404).json({ error: 'Disciplina não encontrada' });
      }

      // 2) monta filtro de matrículas
      const whereMatricula: Prisma.MatriculaWhereInput = {
        IDDisciplina: subjectId
      };

      if (periodoId) {
        whereMatricula.IDPeriodo = String(periodoId);
      } else if (activeOnly !== 'false') {
        // se não foi passado periodoId, e activeOnly !== false, filtra pelo período ativo
        whereMatricula.periodo = { Ativo: true };
      }

      // 3) busca matrículas + aluno
      const matriculas = await prisma.matricula.findMany({
        where: whereMatricula,
        include: {
          aluno: {
            select: { IDAluno: true, Nome: true, Email: true }
          },
          periodo: {
            select: { IDPeriodo: true, Nome: true, Ativo: true }
          }
        },
        orderBy: {
          aluno: { Nome: 'asc' }
        }
      });

      if (matriculas.length === 0) {
        return res.json([]);
      }

      // 4) busca predições em lote (últimas por matrícula/tipo)
      const matriculaIds = matriculas.map(m => m.IDMatricula);

      const predictions = await prisma.prediction.findMany({
        where: {
          IDMatricula: { in: matriculaIds },
          TipoPredicao: { in: ['DESEMPENHO', 'EVASAO'] as any }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          IDMatricula: true,
          TipoPredicao: true,
          Probabilidade: true,
          Classificacao: true,
          createdAt: true
        }
      });

      // 5) reduz para "última por tipo" por matrícula
      type LastByType = { desempenho?: typeof predictions[number]; evasao?: typeof predictions[number] };
      const lastByMatricula: Record<string, LastByType> = {};

      for (const p of predictions) {
        const bucket = lastByMatricula[p.IDMatricula] || (lastByMatricula[p.IDMatricula] = {});
        if (p.TipoPredicao === 'DESEMPENHO' && !bucket.desempenho) bucket.desempenho = p;
        if (p.TipoPredicao === 'EVASAO' && !bucket.evasao) bucket.evasao = p;
      }

      // 6) monta resposta
      const result = matriculas.map(m => {
        const last = lastByMatricula[m.IDMatricula] || {};
        const perf = last.desempenho;
        const drop = last.evasao;

        // performance_score: prob (0-1) -> 0-100 com 1 casa
        const performance_score =
          typeof perf?.Probabilidade === 'number'
            ? Math.round(perf.Probabilidade * 1000) / 10
            : null;

        // dropout_risk: usa Classificacao; se não houver, thresholds pela probabilidade
        let dropout_risk: 'baixo' | 'médio' | 'alto' | null = null;
        if (drop?.Classificacao) {
          const c = drop.Classificacao.toLowerCase();
          if (c === 'medio') dropout_risk = 'médio';
          else if (['baixo', 'médio', 'alto'].includes(c)) dropout_risk = c as any;
        } 
        if (!dropout_risk && typeof drop?.Probabilidade === 'number') {
          const p = drop.Probabilidade;
          dropout_risk = p < 0.33 ? 'baixo' : p < 0.66 ? 'médio' : 'alto';
        }

        return {
          id: m.aluno.IDAluno,
          name: m.aluno.Nome,
          email: m.aluno.Email,
          performance_score,
          dropout_risk
        };
      });

      return res.json(result);
    } catch (error) {
      console.error('Erro ao listar alunos por disciplina:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}