import { Router } from 'express'
import { AuthController } from '../controllers/authController'
import { UserController } from '../controllers/userController'
import { hashPassword } from '../middleware/passwordMiddleware'

const router = Router()

// Auth routes
router.post('/register', hashPassword, AuthController.register)
router.post('/login', AuthController.login)
router.put('/:id/password', hashPassword, AuthController.updatePassword)

// User routes (listar, deletar, etc)
router.get('/users', UserController.getAll)
router.delete('/users/:id', UserController.delete)

export default router