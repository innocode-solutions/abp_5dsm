import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'

export async function hashPassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body.password) {
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds)

      req.body.PasswordHash = hashedPassword
      delete req.body.password
    }

    next()
  } catch (error) {
    console.error('Erro ao gerar hash da senha:', error)
    return res.status(500).json({ error: 'Erro interno ao processar senha' })
  }
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
