import { Router } from 'express';
import { FeedbackController } from '../controllers/feedbackController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas de feedback requerem autenticação
router.use(AuthMiddleware.authenticateToken);

// GET /feedbacks/me - Retorna feedbacks do aluno logado
router.get('/me', FeedbackController.getMyFeedbacks);

// GET /feedbacks/student/:studentId - Retorna feedbacks de um aluno específico
router.get('/student/:studentId', FeedbackController.getStudentFeedbacks);

export default router;

