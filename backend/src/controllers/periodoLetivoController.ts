import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class PeriodoLetivoController {
  // GET /periodos - Get all academic periods
  static async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, ativo } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: Prisma.PeriodoLetivoWhereInput = {
        ...(search && {
          Nome: { contains: String(search), mode: 'insensitive' }
        }),
        ...(ativo !== undefined && { Ativo: ativo === 'true' })
      };

      const [periodos, total] = await Promise.all([
        prisma.periodoLetivo.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            _count: {
              select: {
                matriculas: true
              }
            }
          },
          orderBy: { DataInicio: 'desc' }
        }),
        prisma.periodoLetivo.count({ where })
      ]);

      res.json({
        data: periodos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching academic periods');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /periodos/:id - Get academic period by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const periodo = await prisma.periodoLetivo.findUnique({
        where: { IDPeriodo: id },
        include: {
          matriculas: {
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
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              matriculas: true
            }
          }
        }
      });

      if (!periodo) {
        return res.status(404).json({ error: 'Academic period not found' });
      }

      res.json(periodo);
    } catch (error) {
      console.error('Error fetching academic period');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /periodos - Create new academic period
  static async create(req: Request, res: Response) {
    try {
      const { Nome, DataInicio, DataFim, Ativo = true } = req.body;

      if (!Nome || !DataInicio || !DataFim) {
        return res.status(400).json({ error: 'Name, start date, and end date are required' });
      }

      // Validate dates
      const startDate = new Date(DataInicio);
      const endDate = new Date(DataFim);

      if (startDate >= endDate) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }

      // Check for overlapping periods if this period is active
      if (Ativo) {
        const overlappingPeriod = await prisma.periodoLetivo.findFirst({
          where: {
            Ativo: true,
            OR: [
              {
                AND: [
                  { DataInicio: { lte: startDate } },
                  { DataFim: { gte: startDate } }
                ]
              },
              {
                AND: [
                  { DataInicio: { lte: endDate } },
                  { DataFim: { gte: endDate } }
                ]
              },
              {
                AND: [
                  { DataInicio: { gte: startDate } },
                  { DataFim: { lte: endDate } }
                ]
              }
            ]
          }
        });

        if (overlappingPeriod) {
          return res.status(409).json({ error: 'There is already an active period overlapping with these dates' });
        }
      }

      const periodo = await prisma.periodoLetivo.create({
        data: {
          Nome,
          DataInicio: startDate,
          DataFim: endDate,
          Ativo
        },
        include: {
          _count: {
            select: {
              matriculas: true
            }
          }
        }
      });

      res.status(201).json(periodo);
    } catch (error) {
      console.error('Error creating academic period');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /periodos/:id - Update academic period
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { Nome, DataInicio, DataFim, Ativo } = req.body;

      // Validate dates if provided
      if (DataInicio && DataFim) {
        const startDate = new Date(DataInicio);
        const endDate = new Date(DataFim);

        if (startDate >= endDate) {
          return res.status(400).json({ error: 'Start date must be before end date' });
        }
      }

      // Check for overlapping periods if this period is being set to active
      if (Ativo === true) {
        const currentPeriod = await prisma.periodoLetivo.findUnique({
          where: { IDPeriodo: id }
        });

        if (!currentPeriod) {
          return res.status(404).json({ error: 'Academic period not found' });
        }

        const startDate = DataInicio ? new Date(DataInicio) : currentPeriod.DataInicio;
        const endDate = DataFim ? new Date(DataFim) : currentPeriod.DataFim;

        const overlappingPeriod = await prisma.periodoLetivo.findFirst({
          where: {
            IDPeriodo: { not: id },
            Ativo: true,
            OR: [
              {
                AND: [
                  { DataInicio: { lte: startDate } },
                  { DataFim: { gte: startDate } }
                ]
              },
              {
                AND: [
                  { DataInicio: { lte: endDate } },
                  { DataFim: { gte: endDate } }
                ]
              },
              {
                AND: [
                  { DataInicio: { gte: startDate } },
                  { DataFim: { lte: endDate } }
                ]
              }
            ]
          }
        });

        if (overlappingPeriod) {
          return res.status(409).json({ error: 'There is already an active period overlapping with these dates' });
        }
      }

      const periodo = await prisma.periodoLetivo.update({
        where: { IDPeriodo: id },
        data: {
          Nome,
          DataInicio: DataInicio ? new Date(DataInicio) : undefined,
          DataFim: DataFim ? new Date(DataFim) : undefined,
          Ativo
        },
        include: {
          _count: {
            select: {
              matriculas: true
            }
          }
        }
      });

      res.json(periodo);
    } catch (error) {
      console.error('Error updating academic period');
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Academic period not found' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /periodos/:id - Delete academic period
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.periodoLetivo.delete({
        where: { IDPeriodo: id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting academic period');
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Academic period not found' });
        }
        if (error.code === 'P2003') {
          return res.status(409).json({ error: 'Cannot delete academic period with associated enrollments' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /periodos/active - Get current active period
  static async getActive(req: Request, res: Response) {
    try {
      const currentDate = new Date();
      
      const activePeriod = await prisma.periodoLetivo.findFirst({
        where: {
          Ativo: true,
          DataInicio: { lte: currentDate },
          DataFim: { gte: currentDate }
        },
        include: {
          _count: {
            select: {
              matriculas: true
            }
          }
        }
      });

      if (!activePeriod) {
        return res.status(404).json({ error: 'No active academic period found' });
      }

      res.json(activePeriod);
    } catch (error) {
      console.error('Error fetching active academic period');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /periodos/:id/activate - Activate a specific period (deactivate others)
  static async activate(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if period exists
      const periodo = await prisma.periodoLetivo.findUnique({
        where: { IDPeriodo: id }
      });

      if (!periodo) {
        return res.status(404).json({ error: 'Academic period not found' });
      }

      // Use transaction to deactivate all periods and activate the selected one
      const result = await prisma.$transaction([
        // Deactivate all periods
        prisma.periodoLetivo.updateMany({
          where: { Ativo: true },
          data: { Ativo: false }
        }),
        // Activate the selected period
        prisma.periodoLetivo.update({
          where: { IDPeriodo: id },
          data: { Ativo: true },
          include: {
            _count: {
              select: {
                matriculas: true
              }
            }
          }
        })
      ]);

      res.json(result[1]);
    } catch (error) {
      console.error('Error activating academic period');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}