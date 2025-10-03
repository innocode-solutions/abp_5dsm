import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { hashPassword } from '../middleware/passwordMiddleware';

const router = Router();

// GET /api/users - Get all users
router.get('/', UserController.getAll);

// GET /api/users/role/:role - Get users by role (Deve vir antes de /:id)
router.get('/role/:role', UserController.getByRole);

// GET /api/users/:id - Get user by ID
router.get('/:id', UserController.getById);

// POST /api/users - Create new user
router.post('/', hashPassword, UserController.create);

// PUT /api/users/:id - Update user
router.put('/:id', UserController.update);

// PUT /api/users/:id/password - Update user password
router.put('/:id/password', hashPassword, UserController.updatePassword);

// DELETE /api/users/:id - Delete user
router.delete('/:id', UserController.delete);

export default router;