import { Router } from 'express';
import { CursoController } from '../controllers/cursoController';

const router = Router();

// GET /api/cursos - Get all courses
router.get('/', CursoController.getAll);

// GET /api/cursos/:id - Get course by ID
router.get('/:id', CursoController.getById);

// POST /api/cursos - Create new course
router.post('/', CursoController.create);

// PUT /api/cursos/:id - Update course
router.put('/:id', CursoController.update);

// DELETE /api/cursos/:id - Delete course
router.delete('/:id', CursoController.delete);

export default router;