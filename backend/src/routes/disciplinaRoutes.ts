import { Router } from 'express';
import { DisciplinaController } from '../controllers/disciplinaController';
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(AuthMiddleware.authenticateToken);

// GET /api/disciplinas - Get all subjects (todos autenticados)
router.get('/', DisciplinaController.getAll);

// GET /api/disciplinas/:id - Get subject by ID (todos autenticados)
router.get('/:id', DisciplinaController.getById);

// POST /api/disciplinas - Create new subject (ADMIN ou TEACHER)
router.post('/', AuthMiddleware.requireAnyRole([UserRole.ADMIN, UserRole.TEACHER]), DisciplinaController.create);

// PUT /api/disciplinas/:id - Update subject (apenas ADMIN)
router.put('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), DisciplinaController.update);

// DELETE /api/disciplinas/:id - Delete subject (apenas ADMIN)
router.delete('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), DisciplinaController.delete);

// GET /api/disciplinas/curso/:cursoId - Get subjects by course (todos autenticados)
router.get('/curso/:cursoId', DisciplinaController.getByCourse);

export default router;