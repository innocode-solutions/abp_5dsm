import { Router } from 'express';
import { NotaController } from '../controllers/notaController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(AuthMiddleware.authenticateToken);

// GET /notas/matricula/:matriculaId - Buscar todas as notas de uma matrícula
router.get('/matricula/:matriculaId', NotaController.getByMatricula);

// GET /notas/aluno/:alunoId - Buscar todas as notas de um aluno
router.get('/aluno/:alunoId', NotaController.getByAluno);

// GET /notas/:id - Buscar uma nota específica
router.get('/:id', NotaController.getById);

// POST /notas - Criar uma nova nota (apenas professores e admins)
router.post('/', NotaController.create);

// PUT /notas/:id - Atualizar uma nota (apenas professores e admins)
router.put('/:id', NotaController.update);

// DELETE /notas/:id - Deletar uma nota (apenas professores e admins)
router.delete('/:id', NotaController.delete);

export default router;


