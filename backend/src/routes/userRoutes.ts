import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { hashPassword } from '../middleware/passwordMiddleware';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { UserRole } from '../middleware/authMiddleware';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(AuthMiddleware.authenticateToken);

// GET /api/users - Get all users (apenas ADMIN)
router.get('/', AuthMiddleware.requireRole(UserRole.ADMIN), UserController.getAll);

// GET /api/users/role/:role - Get users by role (apenas ADMIN)
router.get('/role/:role', AuthMiddleware.requireRole(UserRole.ADMIN), UserController.getByRole);

// GET /api/users/:id - Get user by ID (próprio usuário ou ADMIN)
router.get('/:id', AuthMiddleware.requireOwnershipOrAdmin, UserController.getById);

// POST /api/users - Create new user (apenas ADMIN)
router.post('/', AuthMiddleware.requireRole(UserRole.ADMIN), hashPassword, UserController.create);

// PUT /api/users/:id - Update user (próprio usuário ou ADMIN)
router.put('/:id', AuthMiddleware.requireOwnershipOrAdmin, UserController.update);

// PUT /api/users/:id/password - Update user password (próprio usuário ou ADMIN)
router.put('/:id/password', AuthMiddleware.requireOwnershipOrAdmin, hashPassword, UserController.updatePassword);

// DELETE /api/users/:id - Delete user (apenas ADMIN)
router.delete('/:id', AuthMiddleware.requireRole(UserRole.ADMIN), UserController.delete);

export default router;