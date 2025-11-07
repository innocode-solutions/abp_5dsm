import { Router } from 'express'
import { AuthController } from '../controllers/authController'
import { UserController } from '../controllers/userController'
import { hashPassword } from '../middleware/passwordMiddleware'
import { AuthMiddleware } from '../middleware/authMiddleware'
import { validateBody } from '../middleware/validationMiddleware'
import { authLoginSchema, authRegisterSchema, forgotPasswordSchema } from '../validation/authSchemas'
import { passwordResetLimiter } from '../middleware/rateLimitMiddleware'

const router = Router()

// Auth routes públicas
router.post('/register', validateBody(authRegisterSchema), hashPassword, AuthController.register)
router.post('/login', validateBody(authLoginSchema), AuthController.login)
router.post(
  '/password/forgot',
  validateBody(forgotPasswordSchema),
  passwordResetLimiter,
  AuthController.forgotPassword
)

// Auth routes protegidas
router.get('/me', AuthMiddleware.authenticateToken, AuthController.me)
router.put('/:id/password', AuthMiddleware.authenticateToken, hashPassword, AuthController.updatePassword)

// User routes (listar, deletar, etc) - movidas para userRoutes.ts
// router.get('/users', UserController.getAll)
// router.delete('/users/:id', UserController.delete)

export default router