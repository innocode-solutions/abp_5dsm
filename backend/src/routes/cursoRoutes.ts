import { Router } from 'express';
import { CursoController } from '../controllers/cursoController';
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware';

const router = Router();

// GET /api/cursos - Get all courses (todos autenticados)
router.get('/', CursoController.getAll);

// GET /api/cursos/:id - Get course by ID (todos autenticados)
router.get('/:id', CursoController.getById);

// POST /api/cursos - Create new course (apenas ADMIN)
router.post('/', AuthMiddleware.requireRole(UserRole.ADMIN), CursoController.create);

// PUT /api/cursos/:id - Update course (apenas ADMIN)
router.put('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), CursoController.update);

// DELETE /api/cursos/:id - Delete course (apenas ADMIN)
router.delete('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), CursoController.delete);

export default router;