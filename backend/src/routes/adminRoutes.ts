import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas requerem autenticação e role ADMIN
router.use(AuthMiddleware.authenticateToken);

// POST /admin/assign-teacher-all-disciplines - Criar professor e associar a todas as disciplinas
router.post('/assign-teacher-all-disciplines', AdminController.assignTeacherToAllDisciplines);

export default router;


