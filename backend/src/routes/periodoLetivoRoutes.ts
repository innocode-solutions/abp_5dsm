import { Router } from 'express';
import { PeriodoLetivoController } from '../controllers/periodoLetivoController';
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(AuthMiddleware.authenticateToken);

// GET /api/periodos - Get all academic periods (todos autenticados)
router.get('/', PeriodoLetivoController.getAll);

// GET /api/periodos/active - Get current active period (todos autenticados)
router.get('/active', PeriodoLetivoController.getActive);

// GET /api/periodos/:id - Get academic period by ID (todos autenticados)
router.get('/:id', PeriodoLetivoController.getById);

// POST /api/periodos - Create new academic period (apenas ADMIN)
router.post('/', AuthMiddleware.requireRole(UserRole.ADMIN), PeriodoLetivoController.create);

// PUT /api/periodos/:id - Update academic period (apenas ADMIN)
router.put('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), PeriodoLetivoController.update);

// PUT /api/periodos/:id/activate - Activate specific period (apenas ADMIN)
router.put('/:id/activate', AuthMiddleware.requireRole(UserRole.ADMIN), PeriodoLetivoController.activate);

// DELETE /api/periodos/:id - Delete academic period (apenas ADMIN)
router.delete('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), PeriodoLetivoController.delete);

export default router;