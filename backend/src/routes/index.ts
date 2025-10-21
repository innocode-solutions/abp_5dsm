import { Router } from 'express';
import cursoRoutes from './cursoRoutes';
import disciplinaRoutes from './disciplinaRoutes';
import alunoRoutes from './alunoRoutes';
import userRoutes from './userRoutes';
import periodoLetivoRoutes from './periodoLetivoRoutes';
import matriculaRoutes from './matriculaRoutes';
import authRoutes from './authRoutes';
import { AuthMiddleware } from '../middleware/authMiddleware';

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
// Rotas públicas (não requerem autenticação)
router.use('/auth', authRoutes);

// Rotas protegidas (requerem autenticação)
router.use('/cursos', AuthMiddleware.authenticateToken, cursoRoutes);
router.use('/disciplinas', AuthMiddleware.authenticateToken, disciplinaRoutes);
router.use('/alunos', AuthMiddleware.authenticateToken, alunoRoutes);
router.use('/users', AuthMiddleware.authenticateToken, userRoutes);
router.use('/periodos', AuthMiddleware.authenticateToken, periodoLetivoRoutes);
router.use('/matriculas', AuthMiddleware.authenticateToken, matriculaRoutes);

export default router;