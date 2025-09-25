import { Router } from 'express';
import { AlunoController } from '../controllers/alunoController';

const router = Router();

// GET /api/alunos - Get all students
router.get('/', AlunoController.getAll);

// GET /api/alunos/:id - Get student by ID
router.get('/:id', AlunoController.getById);

// POST /api/alunos - Create new student
router.post('/', AlunoController.create);

// PUT /api/alunos/:id - Update student
router.put('/:id', AlunoController.update);

// DELETE /api/alunos/:id - Delete student
router.delete('/:id', AlunoController.delete);

// GET /api/alunos/curso/:cursoId - Get students by course
router.get('/curso/:cursoId', AlunoController.getByCourse);

// GET /api/alunos/:id/matriculas - Get student enrollments
router.get('/:id/matriculas', AlunoController.getEnrollments);

export default router;