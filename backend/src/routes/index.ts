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
import alunoHabitoRoutes from './alunoHabitoRoutes';
import feedbackRoutes from './feedbackRoutes';
import notaRoutes from './notaRoutes';
import adminRoutes from './adminRoutes';
import notificacaoRoutes from './notificacaoRoutes';

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

// ✅ Rotas protegidas (autenticação aplicada individualmente em cada rota)
router.use('/cursos', cursoRoutes);
router.use('/disciplinas', disciplinaRoutes);
router.use('/alunos', alunoRoutes);
router.use('/aluno-habitos', alunoHabitoRoutes);
router.use('/users', userRoutes);
router.use('/periodos', periodoLetivoRoutes);
router.use('/matriculas', matriculaRoutes);
router.use('/predictions', predictionRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/notas', notaRoutes);
router.use('/admin', adminRoutes);
router.use('/notificacoes', notificacaoRoutes);

// ✅ Dashboards separados (IES e Professor)
router.use('/dashboard/ies', dashboardRoutesIES); // Admin/IES
router.use('/dashboard', dashboardRoutesProfessor); // Professor/Admin

export default router;