import { Router } from 'express';
import { AlunoController } from '../controllers/alunoController';
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware';

const router = Router();

// GET /api/alunos - Get all students (TEACHER e ADMIN)
router.get('/', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), AlunoController.getAll);

// GET /api/alunos/:id - Get student by ID (próprio aluno, TEACHER ou ADMIN)
router.get('/:id', AlunoController.getById);

// POST /api/alunos - Create new student (apenas ADMIN)
router.post('/', AuthMiddleware.requireRole(UserRole.ADMIN), AlunoController.create);

// PUT /api/alunos/:id - Update student (próprio aluno ou ADMIN)
router.put('/:id', AlunoController.update);

// DELETE /api/alunos/:id - Delete student (apenas ADMIN)
router.delete('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), AlunoController.delete);

// GET /api/alunos/curso/:cursoId - Get students by course (TEACHER e ADMIN)
router.get('/curso/:cursoId', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), AlunoController.getByCourse);

// GET /api/alunos/:id/matriculas - Get student enrollments (próprio aluno, TEACHER ou ADMIN)
router.get('/:id/matriculas', AlunoController.getEnrollments);

export default router;