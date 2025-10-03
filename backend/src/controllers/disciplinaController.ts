import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class DisciplinaController {
  // GET /disciplinas - Get all subjects
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, cursoId, ativa } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: Prisma.DisciplinaWhereInput = {
        ...(search && {
          OR: [
            { NomeDaDisciplina: { contains: String(search), mode: 'insensitive' } },
            { CodigoDaDisciplina: { contains: String(search), mode: 'insensitive' } }
          ]
        }),
        ...(cursoId && { IDCurso: String(cursoId) }),
        ...(ativa !== undefined && { Ativa: ativa === 'true' })
      };

      const [disciplinas, total] = await Promise.all([
        prisma.disciplina.findMany({
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
            _count: {
              select: {
                matriculas: true
              }
            }
          },
          orderBy: { NomeDaDisciplina: 'asc' }
        }),
        prisma.disciplina.count({ where })
      ]);

      res.json({
        data: disciplinas,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /disciplinas/:id - Get subject by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const disciplina = await prisma.disciplina.findUnique({
        where: { IDDisciplina: id },
        include: {
          curso: true,
          matriculas: {
            include: {
              aluno: {
                select: {
                  IDAluno: true,
                  Nome: true,
                  Email: true
                }
              },
              periodo: {
                select: {
                  IDPeriodo: true,
                  Nome: true
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

      if (!disciplina) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      res.json(disciplina);
    } catch (error) {
      console.error('Error fetching subject:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /disciplinas - Create new subject
  static async create(req: Request, res: Response) {
    try {
      const { IDCurso, NomeDaDisciplina, CodigoDaDisciplina, Ativa = true, CargaHoraria } = req.body;

      if (!IDCurso || !NomeDaDisciplina) {
        return res.status(400).json({ error: 'Course ID and subject name are required' });
      }

      // Verify course exists
      const curso = await prisma.curso.findUnique({
        where: { IDCurso }
      });

      if (!curso) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const disciplina = await prisma.disciplina.create({
        data: {
          IDCurso,
          NomeDaDisciplina,
          CodigoDaDisciplina,
          Ativa,
          CargaHoraria
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

      res.status(201).json(disciplina);
    } catch (error) {
      console.error('Error creating subject:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Subject code already exists for this course' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /disciplinas/:id - Update subject
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { NomeDaDisciplina, CodigoDaDisciplina, Ativa, CargaHoraria } = req.body;

      const disciplina = await prisma.disciplina.update({
        where: { IDDisciplina: id },
        data: {
          NomeDaDisciplina,
          CodigoDaDisciplina,
          Ativa,
          CargaHoraria
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

      res.json(disciplina);
    } catch (error) {
      console.error('Error updating subject:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Subject not found' });
        }
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Subject code already exists for this course' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /disciplinas/:id - Delete subject
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.disciplina.delete({
        where: { IDDisciplina: id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting subject:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Subject not found' });
        }
        if (error.code === 'P2003') {
          return res.status(409).json({ error: 'Cannot delete subject with associated enrollments' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /disciplinas/curso/:cursoId - Get subjects by course
  static async getByCourse(req: Request, res: Response) {
    try {
      const { cursoId } = req.params;
      const { ativa } = req.query;

      const where: Prisma.DisciplinaWhereInput = {
        IDCurso: cursoId,
        ...(ativa !== undefined && { Ativa: ativa === 'true' })
      };

      const disciplinas = await prisma.disciplina.findMany({
        where,
        include: {
          _count: {
            select: {
              matriculas: true
            }
          }
        },
        orderBy: { NomeDaDisciplina: 'asc' }
      });

      res.json(disciplinas);
    } catch (error) {
      console.error('Error fetching subjects by course:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}