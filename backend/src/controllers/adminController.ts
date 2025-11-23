import { Request, Response } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export class AdminController {
  // POST /admin/assign-teacher-all-disciplines - Criar professor e associar a todas as disciplinas
  static async assignTeacherToAllDisciplines(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se é ADMIN
      const user = await prisma.user.findUnique({
        where: { IDUser: userId },
        select: { Role: true },
      });

      if (user?.Role !== 'ADMIN') {
        return res.status(403).json({ error: 'Apenas administradores podem executar esta ação' });
      }

      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ 
          error: 'Email, senha e nome são obrigatórios' 
        });
      }

      // Verificar se o professor já existe
      let teacher = await prisma.user.findUnique({
        where: { Email: email },
      });

      if (teacher) {
        // Se já existe, atualizar para TEACHER se necessário
        if (teacher.Role !== 'TEACHER') {
          teacher = await prisma.user.update({
            where: { IDUser: teacher.IDUser },
            data: { Role: 'TEACHER' },
          });
        }
      } else {
        // Criar novo professor
        const passwordHash = await bcrypt.hash(password, 10);
        teacher = await prisma.user.create({
          data: {
            Email: email,
            PasswordHash: passwordHash,
            Role: 'TEACHER',
            name: name,
          },
        });
      }

      // Buscar todas as disciplinas
      const disciplinas = await prisma.disciplina.findMany({
        where: { Ativa: true },
        select: {
          IDDisciplina: true,
          NomeDaDisciplina: true,
        },
      });

      res.json({
        message: 'Professor criado/atualizado com sucesso',
        teacher: {
          IDUser: teacher.IDUser,
          Email: teacher.Email,
          name: teacher.name,
          Role: teacher.Role,
        },
        disciplinasCount: disciplinas.length,
        disciplinas: disciplinas,
        note: 'Professores podem acessar todas as disciplinas através dos endpoints de turmas',
      });
    } catch (error: any) {
      console.error('Erro ao criar/atualizar professor');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

