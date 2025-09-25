import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'

export const hashPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if password is provided in the request body
    if (req.body.password) {
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds)
      
      // Replace password with PasswordHash in the request body
      req.body.PasswordHash = hashedPassword
      delete req.body.password // Remove the plain password from the request
    }
    
    next()
  } catch (error) {
    console.error('Error hashing password:', error)
    return res.status(500).json({ error: 'Erro interno ao processar senha' })
  }
}