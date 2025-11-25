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
      
      // Normalizar role do token para garantir compatibilidade
      let normalizedRole = String(payload.role || '').toUpperCase().trim()
      
      // Garantir que o role seja um valor válido do enum
      if (!Object.values(UserRole).includes(normalizedRole as UserRole)) {
        // Se não for um valor válido, tentar mapear
        const roleMap: Record<string, UserRole> = {
          'STUDENT': UserRole.STUDENT,
          'TEACHER': UserRole.TEACHER,
          'ADMIN': UserRole.ADMIN
        }
        normalizedRole = roleMap[normalizedRole] || normalizedRole
      }
      
      req.user = {
        userId: payload.userId,
        role: normalizedRole as UserRole,
        email: payload.email,
        studentId: payload.studentId
      } as UserInfo
      
      console.log(`[AUTH] Token decodificado. Role: ${normalizedRole}, Tipo: ${typeof normalizedRole}`)
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

      // Normalizar role para comparação (case-insensitive e garantir que seja string)
      const userRoleStr = String(req.user.role || '').toUpperCase().trim()
      const normalizedAllowedRoles = allowedRoles.map(r => String(r).toUpperCase().trim())

      // Log para debug
      console.log(`[AUTH] Verificando permissão. Role do usuário: "${userRoleStr}", Roles permitidas: [${normalizedAllowedRoles.join(', ')}]`)
      console.log(`[AUTH] Tipo do role: ${typeof req.user.role}, Valor original: ${req.user.role}`)

      // Verificar se o role do usuário está na lista de roles permitidas
      const hasPermission = normalizedAllowedRoles.some(allowedRole => allowedRole === userRoleStr)

      if (!hasPermission) {
        console.log(`[AUTH] ❌ Acesso negado. Role do usuário: ${userRoleStr}, Roles permitidas: ${normalizedAllowedRoles.join(', ')}`)
        return res.status(403).json({ 
          error: 'Acesso negado. Permissão insuficiente.',
          userRole: userRoleStr,
          allowedRoles: normalizedAllowedRoles,
          debug: {
            originalRole: req.user.role,
            roleType: typeof req.user.role
          }
        })
      }

      console.log(`[AUTH] ✅ Permissão concedida para role: ${userRoleStr}`)
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

  /**
   * Middleware para validar reset token (JWT com type: "password_reset")
   */
  static authenticateResetToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de redefinição requerido' })
    }

    const resetSecret = 
      process.env.JWT_RESET_SECRET || 
      process.env.JWT_SECRET || 
      'your-super-secret-jwt-key-change-this-in-production'

    jwt.verify(token, resetSecret, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token de redefinição expirado' })
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Token de redefinição inválido' })
        }
        return res.status(403).json({ error: 'Token não autorizado' })
      }

      // Verifica se o token é do tipo password_reset
      if (decoded.type !== 'password_reset') {
        return res.status(403).json({ error: 'Token inválido para redefinição de senha' })
      }

      // Adiciona informações do usuário ao request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: UserRole.STUDENT, // Valor padrão, não usado neste contexto
      } as UserInfo

      next()
    })
  }
}
