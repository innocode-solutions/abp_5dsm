import { Router } from 'express';
import cursoRoutes from './cursoRoutes';
import disciplinaRoutes from './disciplinaRoutes';
import alunoRoutes from './alunoRoutes';
import userRoutes from './userRoutes';
import periodoLetivoRoutes from './periodoLetivoRoutes';
import matriculaRoutes from './matriculaRoutes';
import predictionRoutes from './predictionRoutes';
import authRoutes from './authRoutes';
import dashboardRoutesProfessor from './dashboardRoutes'; // dashboard do professor
import dashboardRoutesIES from './dashboardIESRoutes'; // dashboard da IES (admin)

import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ✅ Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'API rodando corretamente',
  });
});

// ✅ Rotas públicas
router.use('/auth', authRoutes);

// ✅ Rotas protegidas
router.use('/cursos', AuthMiddleware.authenticateToken, cursoRoutes);
router.use('/disciplinas', AuthMiddleware.authenticateToken, disciplinaRoutes);
router.use('/alunos', AuthMiddleware.authenticateToken, alunoRoutes);
router.use('/users', AuthMiddleware.authenticateToken, userRoutes);
router.use('/periodos', AuthMiddleware.authenticateToken, periodoLetivoRoutes);
router.use('/matriculas', AuthMiddleware.authenticateToken, matriculaRoutes);
router.use('/predictions', AuthMiddleware.authenticateToken, predictionRoutes);

// ✅ Dashboards separados (IES e Professor)
router.use('/dashboard/ies', AuthMiddleware.authenticateToken, dashboardRoutesIES); // Admin/IES
router.use('/dashboard', AuthMiddleware.authenticateToken, dashboardRoutesProfessor); // Professor/Admin

export default router;