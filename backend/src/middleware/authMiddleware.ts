import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Definir UserRole localmente para evitar problemas de importação
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

// Tipo para informações do usuário
export interface UserInfo {
  userId: string
  role: UserRole
  email: string
  studentId?: string
}

// Estende a interface Request para incluir informações do usuário
declare global {
  namespace Express {
    interface Request {
      user?: UserInfo
    }
  }
}

export interface JWTPayload {
  userId: string
  role: UserRole
  email: string
  studentId?: string
  iat?: number
  exp?: number
}

export class AuthMiddleware {
  /**
   * Middleware para validar token JWT
   */
  static authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' })
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expirado' })
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Token inválido' })
        }
        return res.status(403).json({ error: 'Token não autorizado' })
      }

      const payload = decoded as JWTPayload
      req.user = {
        userId: payload.userId,
        role: payload.role as UserRole,
        email: payload.email,
        studentId: payload.studentId
      } as UserInfo
      next()
    })
  }

  /**
   * Middleware para verificar se o usuário tem uma role específica
   */
  static requireRole(requiredRole: UserRole) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' })
      }

      if (req.user.role !== requiredRole) {
        return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' })
      }

      next()
    }
  }

  /**
   * Middleware para verificar se o usuário tem uma das roles permitidas
   */
  static requireAnyRole(allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' })
      }

      if (!allowedRoles.includes(req.user.role as UserRole)) {
        return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' })
      }

      next()
    }
  }

  /**
   * Middleware para verificar se o usuário pode acessar recursos de outro usuário
   * (próprio usuário ou admin)
   */
  static requireOwnershipOrAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const targetUserId = req.params.id || req.params.userId
    const isAdmin = req.user.role === UserRole.ADMIN
    const isOwner = req.user.userId === targetUserId

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado. Você só pode acessar seus próprios recursos.' })
    }

    next()
  }

  /**
   * Middleware para validar se STUDENT acessa apenas seus próprios dados
   * Verifica se o usuário é o próprio aluno, professor ou admin
   */
  static requireStudentOwnership(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }
    
    const targetAlunoId = req.params.id || req.params.alunoId
    const isAdmin = req.user.role === UserRole.ADMIN
    const isTeacher = req.user.role === UserRole.TEACHER
    const isOwnData = (req.user as UserInfo).studentId === targetAlunoId
    
    if (!isAdmin && !isTeacher && !isOwnData) {
      return res.status(403).json({ error: 'Acesso negado. Você só pode acessar seus próprios dados.' })
    }
    
    next()
  }

  /**
   * Middleware para validar se STUDENT pode acessar suas próprias matrículas
   * Verifica se o aluno está acessando suas próprias matrículas
   */
  static requireStudentMatriculaOwnership(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }
    
    const targetAlunoId = req.params.alunoId || req.params.id
    const isAdmin = req.user.role === UserRole.ADMIN
    const isTeacher = req.user.role === UserRole.TEACHER
    const isOwnData = (req.user as UserInfo).studentId === targetAlunoId
    
    if (!isAdmin && !isTeacher && !isOwnData) {
      return res.status(403).json({ error: 'Acesso negado. Você só pode acessar suas próprias matrículas.' })
    }
    
    next()
  }

  /**
   * Middleware opcional - não falha se não houver token, mas adiciona user se houver
   */
  static optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next()
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (!err && decoded) {
        const payload = decoded as JWTPayload
        req.user = {
          userId: payload.userId,
          role: payload.role as UserRole,
          email: payload.email,
          studentId: payload.studentId
        } as UserInfo
      }
      next()
    })
  }
}
