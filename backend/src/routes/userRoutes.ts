import { Router } from "express";
import { UserController } from "../controllers/userController";
import { hashPassword } from "../middleware/passwordMiddleware";
import { AuthMiddleware, UserRole } from "../middleware/authMiddleware";

const router = Router();

// 🔹 GET /api/users - Todos os usuários (apenas ADMIN)
router.get("/", AuthMiddleware.authenticateToken, AuthMiddleware.requireRole(UserRole.ADMIN), UserController.getAll);

// 🔹 GET /api/users/role/:role - Usuários por role (apenas ADMIN)
router.get("/role/:role", AuthMiddleware.authenticateToken, AuthMiddleware.requireRole(UserRole.ADMIN), UserController.getByRole);

// 🔹 GET /api/users/:id - Usuário por ID (próprio usuário ou ADMIN)
router.get("/:id", AuthMiddleware.authenticateToken, AuthMiddleware.requireOwnershipOrAdmin, UserController.getById);

// 🔹 POST /api/users - Criar usuário (apenas ADMIN)
router.post("/", AuthMiddleware.authenticateToken, AuthMiddleware.requireRole(UserRole.ADMIN), hashPassword, UserController.create);

// 🔹 PUT /api/users/:id - Atualizar usuário (próprio usuário ou ADMIN)
router.put("/:id", AuthMiddleware.authenticateToken, AuthMiddleware.requireOwnershipOrAdmin, UserController.update);

// 🔹 PUT /api/users/:id/password - Atualizar senha (próprio usuário ou ADMIN)
router.put("/:id/password", AuthMiddleware.authenticateToken, AuthMiddleware.requireOwnershipOrAdmin, hashPassword, UserController.updatePassword);

// 🔹 DELETE /api/users/:id - Deletar usuário (apenas ADMIN)
router.delete("/:id", AuthMiddleware.authenticateToken, AuthMiddleware.requireRole(UserRole.ADMIN), UserController.delete);

export default router;