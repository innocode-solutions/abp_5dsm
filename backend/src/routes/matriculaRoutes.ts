import { Router } from 'express';
import { MatriculaController } from '../controllers/matriculaController';
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware';

const router = Router();

// GET /api/matriculas - Get all enrollments (TEACHER e ADMIN)
router.get('/', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), MatriculaController.getAll);

// GET /api/matriculas/:id - Get enrollment by ID (próprio aluno, TEACHER ou ADMIN)
router.get('/:id', AuthMiddleware.requireStudentMatriculaOwnership, MatriculaController.getById);

// POST /api/matriculas - Create new enrollment (TEACHER e ADMIN)
router.post('/', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), MatriculaController.create);

// POST /api/matriculas/bulk - Bulk create enrollments (TEACHER e ADMIN)
router.post('/bulk', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), MatriculaController.bulkCreate);

// PUT /api/matriculas/:id - Update enrollment (TEACHER e ADMIN)
router.put('/:id', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), MatriculaController.update);

// DELETE /api/matriculas/:id - Delete enrollment (apenas ADMIN)
router.delete('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), MatriculaController.delete);

// GET /api/matriculas/aluno/:alunoId - Get enrollments by student (próprio aluno, TEACHER ou ADMIN)
router.get('/aluno/:alunoId', AuthMiddleware.requireStudentMatriculaOwnership, MatriculaController.getByStudent);

// GET /api/matriculas/disciplina/:disciplinaId - Get enrollments by subject (TEACHER e ADMIN)
router.get('/disciplina/:disciplinaId', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), MatriculaController.getBySubject);

// GET /api/matriculas/periodo/:periodoId - Get enrollments by period (TEACHER e ADMIN)
router.get('/periodo/:periodoId', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), MatriculaController.getByPeriod);

export default router;