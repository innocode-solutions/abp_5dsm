import type { Request, Response } from 'express'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { prisma } from '../config/database'
import { Prisma, UserRole } from '@prisma/client'

interface PaginationQuery {
  page?: string
  limit?: string
  search?: string
  role?: string
}

interface CreateUserData {
  Email: string
  PasswordHash: string
  Role: UserRole
  name: string
  studentId?: string
  alunoData?: {
    Nome: string
    Email?: string
    Semestre: number
    IDCurso: string
  }
}

interface UpdateUserData {
  Email?: string
  Role?: UserRole
  name?: string
  studentId?: string
  alunoData?: {
    Nome?: string
    Email?: string
    Semestre?: number
    IDCurso?: string
  }
}

export class UserController {
  private static readonly DEFAULT_PAGE = 1
  private static readonly DEFAULT_LIMIT = 10

  private static readonly USER_SELECT = {
    IDUser: true,
    Email: true,
    Role: true,
    name: true,
    studentId: true,
    createdAt: true,
    updatedAt: true,
    aluno: {
      select: {
        IDAluno: true,
        Nome: true,
        Email: true,
        Semestre: true,
        curso: {
          select: {
            IDCurso: true,
            NomeDoCurso: true
          }
        }
      }
    }
  }

  private static handleError(err: unknown, defaultMessage: string, res: Response) {
    console.error('UserController error:', err)

    if (err instanceof PrismaClientKnownRequestError) {
      switch (err.code) {
        case 'P2002':
          return res.status(409).json({ error: 'Recurso já existe' })
        case 'P2003':
          return res.status(400).json({ error: 'Referência inválida' })
        case 'P2025':
          return res.status(404).json({ error: 'Recurso não encontrado' })
      }
    }

    const message = err instanceof Error ? err.message : defaultMessage
    return res.status(500).json({ message })
  }

  private static buildWhereClause(search?: string, role?: string): Prisma.UserWhereInput {
    return {
      ...(search && {
        OR: [
          { Email: { contains: String(search), mode: 'insensitive' } },
          { name: { contains: String(search), mode: 'insensitive' } }
        ]
      }),
      ...(role && { Role: role as UserRole })
    }
  }

  private static validateRole(role: string): boolean {
    return Object.values(UserRole).includes(role as UserRole)
  }

  private static removePasswordFromUser(user: any) {
    const { PasswordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // GET /users - Get all users
  static async getAll(req: Request, res: Response) {
    try {
      const { page = UserController.DEFAULT_PAGE, limit = UserController.DEFAULT_LIMIT, search, role } = req.query as PaginationQuery
      const skip = (Number(page) - 1) * Number(limit)
      const where = UserController.buildWhereClause(search, role)

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          select: UserController.USER_SELECT,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ])

      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (err: unknown) {
      return UserController.handleError(err, 'Erro interno ao buscar usuários', res)
    }
  }

  // GET /users/:id - Get user by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const user = await prisma.user.findUnique({
        where: { IDUser: id },
        select: UserController.USER_SELECT
      })

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      res.json(user)
    } catch (err: unknown) {
      return UserController.handleError(err, 'Erro interno ao buscar usuário', res)
    }
  }

  // POST /users - Create new user
  static async create(req: Request, res: Response) {
    try {
      const { Email, PasswordHash, Role, name, studentId, alunoData }: CreateUserData = req.body

      // Validate required fields
      if (!Email || !PasswordHash || !Role || !name) {
        return res.status(400).json({
          error: 'Email, password, Role e name são obrigatórios'
        })
      }

      if (!UserController.validateRole(Role)) {
        return res.status(400).json({ error: 'Role inválido' })
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { Email }
      })

      if (existingUser) {
        return res.status(409).json({ error: 'Usuário já existe com este email' })
      }

      // Validate student-specific requirements
      if (Role === UserRole.STUDENT) {
        if (!studentId || !alunoData) {
          return res.status(400).json({
            error: 'studentId e alunoData são obrigatórios para estudantes'
          })
        }

        const existingStudent = await prisma.aluno.findUnique({
          where: { IDAluno: studentId }
        })

        if (existingStudent) {
          return res.status(409).json({ error: 'Estudante já existe com este ID' })
        }
      }

      // Create user with transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            Email,
            PasswordHash,
            Role,
            name,
            studentId: Role === UserRole.STUDENT ? studentId : null
          }
        })

        if (Role === UserRole.STUDENT && alunoData && studentId) {
          await tx.aluno.create({
            data: {
              IDAluno: studentId,
              Nome: alunoData.Nome,
              Email: alunoData.Email || Email,
              Semestre: alunoData.Semestre,
              IDCurso: alunoData.IDCurso,
              user: { connect: { IDUser: user.IDUser } }
            }
          })
        }

        return user
      })

      const userWithoutPassword = UserController.removePasswordFromUser(result)
      res.status(201).json(userWithoutPassword)
    } catch (err: unknown) {
      return UserController.handleError(err, 'Erro interno ao criar usuário', res)
    }
  }

  // PUT /users/:id - Update user
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { Email, Role, name, studentId, alunoData }: UpdateUserData = req.body

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { IDUser: id },
        include: { aluno: true }
      })

      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      // Validate role if provided
      if (Role && !UserController.validateRole(Role)) {
        return res.status(400).json({ error: 'Role inválida' })
      }

      // Check email uniqueness if email is being changed
      if (Email && Email !== existingUser.Email) {
        const emailExists = await prisma.user.findUnique({
          where: { Email }
        })
        if (emailExists) {
          return res.status(409).json({ error: 'Email já está em uso' })
        }
      }

      // Update user with transaction
      const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { IDUser: id },
          data: {
            ...(Email && { Email }),
            ...(Role && { Role }),
            ...(name && { name }),
            ...(studentId !== undefined && { studentId })
          }
        })

        // Handle student data updates
        if ((Role === UserRole.STUDENT || existingUser.Role === UserRole.STUDENT) && alunoData) {
          if (existingUser.aluno) {
            await tx.aluno.update({
              where: { IDAluno: existingUser.aluno.IDAluno },
              data: {
                ...(alunoData.Nome && { Nome: alunoData.Nome }),
                ...(alunoData.Email && { Email: alunoData.Email }),
                ...(alunoData.Semestre && { Semestre: alunoData.Semestre }),
                ...(alunoData.IDCurso && { IDCurso: alunoData.IDCurso })
              }
            })
          } else if (studentId) {
            await tx.aluno.create({
              data: {
                IDAluno: studentId,
                Nome: alunoData.Nome || '',
                Email: alunoData.Email || Email || existingUser.Email,
                Semestre: alunoData.Semestre || 1,
                IDCurso: alunoData.IDCurso || '',
                user: { connect: { IDUser: id } }
              }
            })
          }
        }

        return updatedUser
      })

      const userWithoutPassword = UserController.removePasswordFromUser(result)
      res.json(userWithoutPassword)
    } catch (err: unknown) {
      return UserController.handleError(err, 'Erro interno ao atualizar usuário', res)
    }
  }

  // DELETE /users/:id - Delete user
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params

      const user = await prisma.user.findUnique({
        where: { IDUser: id }
      })

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      await prisma.user.delete({
        where: { IDUser: id }
      })

      res.json({ message: 'Usuário deletado com sucesso' })
    } catch (err: unknown) {
      return UserController.handleError(err, 'Erro interno ao deletar usuário', res)
    }
  }

  // GET /users/role/:role - Get users by role
  static async getByRole(req: Request, res: Response) {
    try {
      const { role } = req.params

      if (!UserController.validateRole(role)) {
        return res.status(400).json({ error: 'Role inválido' })
      }

      const users = await prisma.user.findMany({
        where: { Role: role as UserRole },
        select: {
          IDUser: true,
          Email: true,
          Role: true,
          name: true,
          studentId: true,
          createdAt: true,
          aluno: {
            select: {
              IDAluno: true,
              Nome: true,
              curso: {
                select: {
                  NomeDoCurso: true
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      res.json(users)
    } catch (err: unknown) {
      return UserController.handleError(err, 'Erro ao buscar usuários por função', res)
    }
  }

  // PUT /users/:id/password - Update user password
  static async updatePassword(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { PasswordHash } = req.body

      if (!PasswordHash) {
        return res.status(400).json({
          error: 'Password é obrigatório'
        })
      }

      const existingUser = await prisma.user.findUnique({
        where: { IDUser: id }
      })

      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      await prisma.user.update({
        where: { IDUser: id },
        data: { PasswordHash }
      })

      res.json({ message: 'Senha atualizada com sucesso' })
    } catch (err: unknown) {
      return UserController.handleError(err, 'Erro interno ao atualizar senha', res)
    }
  }
}