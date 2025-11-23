import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { TipoNotificacao, StatusNotificacao } from '@prisma/client';

export class NotificacaoController {
  // GET /notificacoes - Buscar todas as notificações do usuário logado
  static async getMyNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { status, tipo, limit = 50 } = req.query;

      const where: any = {
        IDUser: userId,
      };

      if (status) {
        where.Status = status as StatusNotificacao;
      }

      if (tipo) {
        where.Tipo = tipo as TipoNotificacao;
      }

      const notificacoes = await prisma.notificacao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      res.json(notificacoes);
    } catch (error) {
      console.error('Erro ao buscar notificações');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GET /notificacoes/unread-count - Contar notificações não lidas
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const count = await prisma.notificacao.count({
        where: {
          IDUser: userId,
          Status: StatusNotificacao.NAO_LIDA,
        },
      });

      res.json({ count });
    } catch (error) {
      console.error('Erro ao contar notificações não lidas');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // PUT /notificacoes/:id/read - Marcar notificação como lida
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { id } = req.params;

      const notificacao = await prisma.notificacao.findUnique({
        where: { IDNotificacao: id },
      });

      if (!notificacao) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      }

      if (notificacao.IDUser !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updated = await prisma.notificacao.update({
        where: { IDNotificacao: id },
        data: {
          Status: StatusNotificacao.LIDA,
          lidaEm: new Date(),
        },
      });

      res.json(updated);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // PUT /notificacoes/read-all - Marcar todas as notificações como lidas
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await prisma.notificacao.updateMany({
        where: {
          IDUser: userId,
          Status: StatusNotificacao.NAO_LIDA,
        },
        data: {
          Status: StatusNotificacao.LIDA,
          lidaEm: new Date(),
        },
      });

      res.json({ message: 'Todas as notificações foram marcadas como lidas' });
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // DELETE /notificacoes/:id - Deletar notificação
  static async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { id } = req.params;

      const notificacao = await prisma.notificacao.findUnique({
        where: { IDNotificacao: id },
      });

      if (!notificacao) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      }

      if (notificacao.IDUser !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await prisma.notificacao.delete({
        where: { IDNotificacao: id },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar notificação');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // DELETE /notificacoes/read/all - Deletar todas as notificações lidas
  static async deleteAllRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await prisma.notificacao.deleteMany({
        where: {
          IDUser: userId,
          Status: StatusNotificacao.LIDA,
        },
      });

      res.json({ message: 'Todas as notificações lidas foram deletadas' });
    } catch (error) {
      console.error('Erro ao deletar notificações lidas');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

