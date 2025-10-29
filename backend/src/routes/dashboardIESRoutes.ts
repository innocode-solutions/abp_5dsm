// src/routes/dashboardIESRoutes.ts
import { Router } from 'express'
import { DashboardController } from '../controllers/dashboardIESController'
import { AuthMiddleware, UserRole } from '../middleware/authMiddleware'

const router = Router()

// Todas as rotas protegidas por token e restritas a ADMIN
router.use(AuthMiddleware.authenticateToken)


// GET /dashboard/ies - agregados com filtros
router.get('/', AuthMiddleware.requireRole(UserRole.ADMIN), DashboardController.getIESAggregates)

// GET /dashboard/overview - apenas ADMIN pode acessar
router.get('/overview', AuthMiddleware.requireRole(UserRole.ADMIN), DashboardController.getOverview
)

export default router
