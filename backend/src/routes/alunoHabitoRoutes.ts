import { Router } from 'express'
import { AlunoHabitoController } from '../controllers/alunoHabitoController'
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware'

const router = Router()

// todas as rotas exigem autenticação e papel STUDENT
router.use(AuthMiddleware.authenticateToken)
router.use(AuthMiddleware.requireRole(UserRole.STUDENT))

router.get('/', AlunoHabitoController.getOwnHabitos)
router.post('/', AlunoHabitoController.createOrUpdateOwnHabitos)
router.post('/predict/dropout', AlunoHabitoController.predictDropout)
router.post('/predict/performance', AlunoHabitoController.predictPerformance)

export default router