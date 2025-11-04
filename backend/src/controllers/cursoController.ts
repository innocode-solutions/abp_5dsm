import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class CursoController {
  // GET /cursos - Get all courses
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: Prisma.CursoWhereInput = {
        ...(search && {
          OR: [
            { NomeDoCurso: { contains: String(search), mode: 'insensitive' } },
            { Descricao: { contains: String(search), mode: 'insensitive' } }
          ]
        })
      };

      const [cursos, total] = await Promise.all([
        prisma.curso.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            _count: {
              select: {
                disciplinas: true,
                alunos: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.curso.count({ where })
      ]);

      res.json({
        data: cursos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /cursos/:id - Get course by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const curso = await prisma.curso.findUnique({
        where: { IDCurso: id },
        include: {
          disciplinas: {
            orderBy: { NomeDaDisciplina: 'asc' }
          },
          alunos: {
            orderBy: { Nome: 'asc' }
          },
          _count: {
            select: {
              disciplinas: true,
              alunos: true
            }
          }
        }
      });

      if (!curso) {
        return res.status(404).json({ error: 'Course not found' });
      }

      res.json(curso);
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /cursos - Create new course
  static async create(req: Request, res: Response) {
    try {
      const { NomeDoCurso, Descricao } = req.body;

      if (!NomeDoCurso) {
        return res.status(400).json({ error: 'Course name is required' });
      }

      const curso = await prisma.curso.create({
        data: {
          NomeDoCurso,
          Descricao
        },
        include: {
          _count: {
            select: {
              disciplinas: true,
              alunos: true
            }
          }
        }
      });

      res.status(201).json(curso);
    } catch (error) {
      console.error('Error creating course:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Curso já existe' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /cursos/:id - Update course
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { NomeDoCurso, Descricao } = req.body;

      const curso = await prisma.curso.update({
        where: { IDCurso: id },
        data: {
          NomeDoCurso,
          Descricao
        },
        include: {
          _count: {
            select: {
              disciplinas: true,
              alunos: true
            }
          }
        }
      });

      res.json(curso);
    } catch (error) {
      console.error('Error updating course:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Course not found' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /cursos/:id - Delete course
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.curso.delete({
        where: { IDCurso: id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting course:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Course not found' });
        }
        if (error.code === 'P2003') {
          return res.status(409).json({ error: 'Cannot delete course with associated students or subjects' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}