import { Router } from 'express';
import { DisciplinaController } from '../controllers/disciplinaController';

const router = Router();

// GET /api/disciplinas - Get all subjects
router.get('/', DisciplinaController.getAll);

// GET /api/disciplinas/:id - Get subject by ID
router.get('/:id', DisciplinaController.getById);

// POST /api/disciplinas - Create new subject
router.post('/', DisciplinaController.create);

// PUT /api/disciplinas/:id - Update subject
router.put('/:id', DisciplinaController.update);

// DELETE /api/disciplinas/:id - Delete subject
router.delete('/:id', DisciplinaController.delete);

// GET /api/disciplinas/curso/:cursoId - Get subjects by course
router.get('/curso/:cursoId', DisciplinaController.getByCourse);

export default router;