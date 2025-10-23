import { Router } from 'express';
import { PredictionController } from '../controllers/predictionController';
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas de predições requerem autenticação
router.use(AuthMiddleware.authenticateToken);

// Rotas de predições
router.get('/', PredictionController.getAll);
router.get('/:id', PredictionController.getById);
router.post('/', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), PredictionController.create);
router.put('/:id', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), PredictionController.update);
router.delete('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), PredictionController.delete);

// Rotas específicas
router.get('/matricula/:matriculaId', PredictionController.getByMatricula);
router.get('/tipo/:tipo', PredictionController.getByTipo);

export default router;

