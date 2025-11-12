import { Router } from 'express';
import { PredictionController } from '../controllers/predictionController';
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { generatePredictionSchema } from '../validation/predictionSchemas';

const router = Router();

router.use(AuthMiddleware.authenticateToken);

router.get('/', PredictionController.getAll);
router.get('/:id', PredictionController.getById);
router.post('/', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), PredictionController.create);
router.post('/generate', 
  AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), 
  validateBody(generatePredictionSchema),
  PredictionController.createPrediction
);
router.put('/:id', AuthMiddleware.requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]), PredictionController.update);
router.delete('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), PredictionController.delete);

router.get('/matricula/:matriculaId', PredictionController.getByMatricula);
router.get('/tipo/:tipo', PredictionController.getByTipo);

// Rota para alunos fazerem predições
router.post('/student/generate', 
  AuthMiddleware.requireRole(UserRole.STUDENT),
  PredictionController.createPredictionForStudent
);

export default router;


