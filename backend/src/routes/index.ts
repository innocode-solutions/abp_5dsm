import { Router } from 'express';
import cursoRoutes from './cursoRoutes';
import disciplinaRoutes from './disciplinaRoutes';
import alunoRoutes from './alunoRoutes';
import userRoutes from './userRoutes';
import periodoLetivoRoutes from './periodoLetivoRoutes';
import matriculaRoutes from './matriculaRoutes';
import authRoutes from './authRoutes'

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API rodando corretamente'
  });
});

// API routes
router.use('/cursos', cursoRoutes);
router.use('/disciplinas', disciplinaRoutes);
router.use('/alunos', alunoRoutes);
router.use('/auth', authRoutes)
router.use('/users', userRoutes);
router.use('/periodos', periodoLetivoRoutes);
router.use('/matriculas', matriculaRoutes);

export default router;