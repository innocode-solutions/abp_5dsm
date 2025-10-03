import { Router } from 'express';
import { PeriodoLetivoController } from '../controllers/periodoLetivoController';

const router = Router();

// GET /api/periodos - Get all academic periods
router.get('/', PeriodoLetivoController.getAll);

// GET /api/periodos/active - Get current active period
router.get('/active', PeriodoLetivoController.getActive);

// GET /api/periodos/:id - Get academic period by ID
router.get('/:id', PeriodoLetivoController.getById);

// POST /api/periodos - Create new academic period
router.post('/', PeriodoLetivoController.create);

// PUT /api/periodos/:id - Update academic period
router.put('/:id', PeriodoLetivoController.update);

// PUT /api/periodos/:id/activate - Activate specific period
router.put('/:id/activate', PeriodoLetivoController.activate);

// DELETE /api/periodos/:id - Delete academic period
router.delete('/:id', PeriodoLetivoController.delete);

export default router;