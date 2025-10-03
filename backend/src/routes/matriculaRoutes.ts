import { Router } from 'express';
import { MatriculaController } from '../controllers/matriculaController';

const router = Router();

// GET /api/matriculas - Get all enrollments
router.get('/', MatriculaController.getAll);

// GET /api/matriculas/:id - Get enrollment by ID
router.get('/:id', MatriculaController.getById);

// POST /api/matriculas - Create new enrollment
router.post('/', MatriculaController.create);

// POST /api/matriculas/bulk - Bulk create enrollments
router.post('/bulk', MatriculaController.bulkCreate);

// PUT /api/matriculas/:id - Update enrollment
router.put('/:id', MatriculaController.update);

// DELETE /api/matriculas/:id - Delete enrollment
router.delete('/:id', MatriculaController.delete);

// GET /api/matriculas/aluno/:alunoId - Get enrollments by student
router.get('/aluno/:alunoId', MatriculaController.getByStudent);

// GET /api/matriculas/disciplina/:disciplinaId - Get enrollments by subject
router.get('/disciplina/:disciplinaId', MatriculaController.getBySubject);

// GET /api/matriculas/periodo/:periodoId - Get enrollments by period
router.get('/periodo/:periodoId', MatriculaController.getByPeriod);

export default router;