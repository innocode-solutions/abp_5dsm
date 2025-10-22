import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { UserRole } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas do dashboard requerem autenticação
router.use(AuthMiddleware.authenticateToken);

// GET /dashboard/professor/:id - Dashboard completo do professor
router.get('/professor/:id', 
  AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]),
  DashboardController.getProfessorDashboard
);

// GET /dashboard/professor/:id/resumo - Resumo rápido (apenas métricas)
router.get('/professor/:id/resumo',
  AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]),
  DashboardController.getProfessorDashboardResumo
);

export default router;
