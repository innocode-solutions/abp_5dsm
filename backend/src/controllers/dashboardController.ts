import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { DashboardService, DashboardFilters } from '../service/dashboardService';

export class DashboardController {
  /**
   * GET /dashboard/professor/:id
   * Retorna dashboard com métricas agregadas para o professor
   */
  static async getProfessorDashboard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { disciplinaId, periodoId } = req.query;

      // Verificar se o professor existe (aceita TEACHER ou ADMIN)
      const professor = await prisma.user.findUnique({
        where: { 
          IDUser: id,
          Role: {
            in: ['TEACHER', 'ADMIN']
          }
        },
        select: {
          IDUser: true,
          name: true,
          Email: true
        }
      });

      if (!professor) {
        return res.status(404).json({ error: 'Professor não encontrado' });
      }

      // Construir filtros
      const filters: DashboardFilters = {
        disciplinaId: disciplinaId ? String(disciplinaId) : undefined,
        periodoId: periodoId ? String(periodoId) : undefined,
        professorId: id
      };

      // Buscar dados usando o service otimizado
      const { matriculas, disciplinas, periodos } = await DashboardService.getProfessorDashboardData(id, filters);

      // Calcular métricas agregadas
      const metrics = DashboardService.calculateMetrics(matriculas);

      // Formatar dados dos alunos
      const alunos = DashboardService.formatAlunosData(matriculas);

      res.json({
        professor: {
          id: professor.IDUser,
          nome: professor.name,
          email: professor.Email
        },
        filtros: {
          disciplinaId: disciplinaId || null,
          periodoId: periodoId || null
        },
        metricas: metrics,
        alunos: alunos,
        disciplinas: disciplinas,
        periodos: periodos,
        totalAlunos: alunos.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao buscar dashboard do professor:', error);
      res.status(500).json({ error: 'Erro interno ao buscar dashboard' });
    }
  }


  /**
   * GET /dashboard/professor/:id/resumo
   * Retorna apenas as métricas resumidas (para performance)
   */
  static async getProfessorDashboardResumo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { disciplinaId, periodoId } = req.query;

      // Verificar se o professor existe (aceita TEACHER ou ADMIN)
      const professor = await prisma.user.findUnique({
        where: { 
          IDUser: id,
          Role: {
            in: ['TEACHER', 'ADMIN']
          }
        },
        select: { IDUser: true }
      });

      if (!professor) {
        return res.status(404).json({ error: 'Professor não encontrado' });
      }

      // Construir filtros
      const filters: DashboardFilters = {
        disciplinaId: disciplinaId ? String(disciplinaId) : undefined,
        periodoId: periodoId ? String(periodoId) : undefined,
        professorId: id
      };

      // Buscar dados mínimos usando o service otimizado
      const { matriculas } = await DashboardService.getProfessorDashboardResumoData(id, filters);

      const metrics = DashboardService.calculateMetrics(matriculas);

      res.json({
        professorId: id,
        metricas: metrics,
        totalAlunos: matriculas.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao buscar resumo do dashboard:', error);
      res.status(500).json({ error: 'Erro interno ao buscar resumo' });
    }
  }
}
