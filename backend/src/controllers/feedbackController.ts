import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { getStudentFeedbacks } from '../service/feedbackService';

export class FeedbackController {
  /**
   * GET /feedbacks/student/:studentId
   * Retorna todos os feedbacks formatados de um aluno
   */
  static async getStudentFeedbacks(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        return res.status(400).json({ error: 'ID do aluno é obrigatório' });
      }

      // Verificar se o aluno existe
      const aluno = await prisma.aluno.findUnique({
        where: { IDAluno: studentId },
      });

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      // Verificar se o usuário tem permissão (só pode ver seus próprios feedbacks)
      if (req.user?.userId && aluno.IDUser !== req.user.userId) {
        return res.status(403).json({ error: 'Acesso negado. Você só pode ver seus próprios feedbacks.' });
      }

      const feedbacks = await getStudentFeedbacks(studentId);

      res.json(feedbacks);
    } catch (error) {
      console.error('Erro ao buscar feedbacks do aluno');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * GET /feedbacks/me
   * Retorna os feedbacks do aluno logado
   */
  static async getMyFeedbacks(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Buscar o aluno associado ao usuário
      const aluno = await prisma.aluno.findFirst({
        where: { IDUser: req.user.userId },
      });

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado para este usuário' });
      }

      const feedbacks = await getStudentFeedbacks(aluno.IDAluno);

      res.json(feedbacks);
    } catch (error) {
      console.error('Erro ao buscar feedbacks do usuário');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

