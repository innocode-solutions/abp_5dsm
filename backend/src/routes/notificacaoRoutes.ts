import { Router } from 'express';
import { NotificacaoController } from '../controllers/notificacaoController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(AuthMiddleware.authenticateToken);

// GET /notificacoes - Buscar todas as notificações do usuário logado
router.get('/', NotificacaoController.getMyNotifications);

// GET /notificacoes/unread-count - Contar notificações não lidas
router.get('/unread-count', NotificacaoController.getUnreadCount);

// PUT /notificacoes/:id/read - Marcar notificação como lida
router.put('/:id/read', NotificacaoController.markAsRead);

// PUT /notificacoes/read-all - Marcar todas as notificações como lidas
router.put('/read-all', NotificacaoController.markAllAsRead);

// DELETE /notificacoes/:id - Deletar notificação
router.delete('/:id', NotificacaoController.delete);

// DELETE /notificacoes/read/all - Deletar todas as notificações lidas
router.delete('/read/all', NotificacaoController.deleteAllRead);

export default router;

