import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../config/database'
import { UserRole } from '@prisma/client'

export class AuthController {
  // POST /auth/register
  static async register(req: Request, res: Response) {
    try {
      const { Email, PasswordHash, Role = UserRole.STUDENT, name } = req.body

      if (!Email || !PasswordHash || !name) {
        return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' })
      }

      // Verifica se já existe
      const existingUser = await prisma.user.findUnique({
        where: { Email }
      })

      if (existingUser) {
        return res.status(409).json({ error: 'Usuário já existe com este email' })
      }

      // Cria usuário
      const user = await prisma.user.create({
        data: {
          Email,
          PasswordHash, // já vem do middleware hashPassword
          Role,
          name
        },
        select: {
          IDUser: true,
          Email: true,
          Role: true,
          name: true,
          createdAt: true
        }
      })

      res.status(201).json(user)
    } catch (err) {
      console.error('Erro ao registrar usuário:', err)
      res.status(500).json({ error: 'Erro interno ao registrar usuário' })
    }
  }

  // POST /auth/login
  static async login(req: Request, res: Response) {
    try {
      const { Email, password } = req.body

      if (!Email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' })
      }

      const user = await prisma.user.findUnique({
        where: { Email },
        select: {
          IDUser: true,
          Email: true,
          PasswordHash: true,
          Role: true,
          name: true,
          createdAt: true
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      // Compara senha
      const isValid = await bcrypt.compare(password, user.PasswordHash)
      if (!isValid) {
        return res.status(401).json({ error: 'Senha inválida' })
      }

      // Retorna dados sem senha
      const { PasswordHash, ...userWithoutPassword } = user
      res.json(userWithoutPassword)
    } catch (err) {
      console.error('Erro ao realizar login:', err)
      res.status(500).json({ error: 'Erro interno ao realizar login' })
    }
  }

  // PUT /auth/:id/password - Atualizar senha
  static async updatePassword(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { PasswordHash } = req.body

      if (!PasswordHash) {
        return res.status(400).json({ error: 'Nova senha é obrigatória' })
      }

      const existingUser = await prisma.user.findUnique({
        where: { IDUser: id }
      })

      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds)

      await prisma.user.update({
        where: { IDUser: id },
        data: { PasswordHash: hashedPassword }
      })

      res.json({ message: 'Senha atualizada com sucesso' })
    } catch (err) {
      console.error('Erro ao atualizar senha:', err)
      res.status(500).json({ error: 'Erro interno ao atualizar senha' })
    }
  }
}
