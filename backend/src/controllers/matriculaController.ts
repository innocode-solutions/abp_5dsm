import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Prisma, StatusMatricula } from '@prisma/client';

export class MatriculaController {
  // GET /matriculas - Get all enrollments
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, alunoId, disciplinaId, periodoId, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: Prisma.MatriculaWhereInput = {
        ...(alunoId && { IDAluno: String(alunoId) }),
        ...(disciplinaId && { IDDisciplina: String(disciplinaId) }),
        ...(periodoId && { IDPeriodo: String(periodoId) }),
        ...(status && { Status: status as StatusMatricula })
      };

      const [matriculas, total] = await Promise.all([
        prisma.matricula.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            aluno: {
              select: {
                IDAluno: true,
                Nome: true,
                Email: true,
                curso: {
                  select: {
                    NomeDoCurso: true
                  }
                }
              }
            },
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
                DataFim: true,
                Ativo: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.matricula.count({ where })
      ]);

      res.json({
        data: matriculas,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /matriculas/:id - Get enrollment by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const matricula = await prisma.matricula.findUnique({
        where: { IDMatricula: id },
        include: {
          aluno: {
            include: {
              curso: {
                select: {
                  IDCurso: true,
                  NomeDoCurso: true
                }
              }
            }
          },
          disciplina: {
            include: {
              curso: {
                select: {
                  IDCurso: true,
                  NomeDoCurso: true
                }
              }
            }
          },
          periodo: true
        }
      });

      if (!matricula) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      res.json(matricula);
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /matriculas - Create new enrollment
  static async create(req: Request, res: Response) {
    try {
      const { IDAluno, IDDisciplina, IDPeriodo, Status = StatusMatricula.ENROLLED } = req.body;

      if (!IDAluno || !IDDisciplina || !IDPeriodo) {
        return res.status(400).json({ error: 'Student ID, subject ID, and period ID are required' });
      }

      // Verify student exists
      const aluno = await prisma.aluno.findUnique({
        where: { IDAluno },
        include: {
          curso: true
        }
      });

      if (!aluno) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Verify subject exists
      const disciplina = await prisma.disciplina.findUnique({
        where: { IDDisciplina },
        include: {
          curso: true
        }
      });

      if (!disciplina) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      // Verify period exists
      const periodo = await prisma.periodoLetivo.findUnique({
        where: { IDPeriodo }
      });

      if (!periodo) {
        return res.status(404).json({ error: 'Academic period not found' });
      }

      // Verify student and subject belong to the same course
      if (aluno.IDCurso !== disciplina.IDCurso) {
        return res.status(400).json({ error: 'Student and subject must belong to the same course' });
      }

      // Check if subject is active
      if (!disciplina.Ativa) {
        return res.status(400).json({ error: 'Cannot enroll in inactive subject' });
      }

      // Check if period is active for new enrollments
      if (!periodo.Ativo) {
        return res.status(400).json({ error: 'Cannot enroll in inactive academic period' });
      }

      const matricula = await prisma.matricula.create({
        data: {
          IDAluno,
          IDDisciplina,
          IDPeriodo,
          Status
        },
        include: {
          aluno: {
            select: {
              IDAluno: true,
              Nome: true,
              Email: true,
              curso: {
                select: {
                  NomeDoCurso: true
                }
              }
            }
          },
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
        }
      });

      res.status(201).json(matricula);
    } catch (error) {
      console.error('Error creating enrollment:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Student is already enrolled in this subject for this period' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /matriculas/:id - Update enrollment
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { Status } = req.body;

      if (!Status || !Object.values(StatusMatricula).includes(Status)) {
        return res.status(400).json({ error: 'Valid status is required' });
      }

      const matricula = await prisma.matricula.update({
        where: { IDMatricula: id },
        data: { Status },
        include: {
          aluno: {
            select: {
              IDAluno: true,
              Nome: true,
              Email: true,
              curso: {
                select: {
                  NomeDoCurso: true
                }
              }
            }
          },
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
        }
      });

      res.json(matricula);
    } catch (error) {
      console.error('Error updating enrollment:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Enrollment not found' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /matriculas/:id - Delete enrollment
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.matricula.delete({
        where: { IDMatricula: id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Enrollment not found' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /matriculas/aluno/:alunoId - Get enrollments by student
  static async getByStudent(req: Request, res: Response) {
    try {
      const { alunoId } = req.params;
      const { status, periodoId } = req.query;

      const where: Prisma.MatriculaWhereInput = {
        IDAluno: alunoId,
        ...(status && { Status: status as StatusMatricula }),
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
      console.error('Error fetching enrollments by student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /matriculas/disciplina/:disciplinaId - Get enrollments by subject
  static async getBySubject(req: Request, res: Response) {
    try {
      const { disciplinaId } = req.params;
      const { status, periodoId } = req.query;

      const where: Prisma.MatriculaWhereInput = {
        IDDisciplina: disciplinaId,
        ...(status && { Status: status as StatusMatricula }),
        ...(periodoId && { IDPeriodo: String(periodoId) })
      };

      const matriculas = await prisma.matricula.findMany({
        where,
        include: {
          aluno: {
            select: {
              IDAluno: true,
              Nome: true,
              Email: true,
              Semestre: true
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
        orderBy: [
          { aluno: { Nome: 'asc' } }
        ]
      });

      res.json(matriculas);
    } catch (error) {
      console.error('Error fetching enrollments by subject:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /matriculas/periodo/:periodoId - Get enrollments by period
  static async getByPeriod(req: Request, res: Response) {
    try {
      const { periodoId } = req.params;
      const { status, cursoId } = req.query;

      const where: Prisma.MatriculaWhereInput = {
        IDPeriodo: periodoId,
        ...(status && { Status: status as StatusMatricula }),
        ...(cursoId && { 
          aluno: { IDCurso: String(cursoId) }
        })
      };

      const matriculas = await prisma.matricula.findMany({
        where,
        include: {
          aluno: {
            select: {
              IDAluno: true,
              Nome: true,
              Email: true,
              curso: {
                select: {
                  NomeDoCurso: true
                }
              }
            }
          },
          disciplina: {
            select: {
              IDDisciplina: true,
              NomeDaDisciplina: true,
              CodigoDaDisciplina: true
            }
          }
        },
        orderBy: [
          { aluno: { Nome: 'asc' } },
          { disciplina: { NomeDaDisciplina: 'asc' } }
        ]
      });

      res.json(matriculas);
    } catch (error) {
      console.error('Error fetching enrollments by period:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /matriculas/bulk - Bulk create enrollments
  static async bulkCreate(req: Request, res: Response) {
    try {
      const { enrollments } = req.body;

      if (!Array.isArray(enrollments) || enrollments.length === 0) {
        return res.status(400).json({ error: 'Enrollments array is required' });
      }

      // Validate each enrollment
      for (const enrollment of enrollments) {
        if (!enrollment.IDAluno || !enrollment.IDDisciplina || !enrollment.IDPeriodo) {
          return res.status(400).json({ error: 'Each enrollment must have student ID, subject ID, and period ID' });
        }
      }

      const results = await prisma.$transaction(
        enrollments.map(enrollment => 
          prisma.matricula.create({
            data: {
              IDAluno: enrollment.IDAluno,
              IDDisciplina: enrollment.IDDisciplina,
              IDPeriodo: enrollment.IDPeriodo,
              Status: enrollment.Status || StatusMatricula.ENROLLED
            },
            include: {
              aluno: {
                select: {
                  Nome: true
                }
              },
              disciplina: {
                select: {
                  NomeDaDisciplina: true
                }
              }
            }
          })
        )
      );

      res.status(201).json({
        message: `${results.length} enrollments created successfully`,
        data: results
      });
    } catch (error) {
      console.error('Error bulk creating enrollments:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'One or more students are already enrolled in the specified subjects for the period' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}