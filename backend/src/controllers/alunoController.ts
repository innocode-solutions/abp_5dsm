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
      const { Nome, Email, Idade, IDCurso, Semestre } = req.body;

      if (!Nome || !Email || !IDCurso) {
        return res.status(400).json({ error: 'Name, email, and course ID are required' });
      }

      // Verify course exists
      const curso = await prisma.curso.findUnique({
        where: { IDCurso }
      });

      if (!curso) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const aluno = await prisma.aluno.create({
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

      res.status(201).json(aluno);
    } catch (error) {
      console.error('Error creating student:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ error: 'Email already exists' });
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
}