import type { Request, Response, NextFunction } from 'express'
import type { ZodTypeAny } from 'zod'

type Location = 'body' | 'query' | 'params'

function makeValidator(schema: ZodTypeAny, location: Location) {
  return (req: Request, res: Response, next: NextFunction) => {
    const target = req[location as keyof Request] as unknown
    const result = schema.safeParse(target)
    if (!result.success) {
      const details = result.error.issues.map(issue => ({
        path: issue.path.join('.') || location,
        message: issue.message,
        code: issue.code,
      }))
      return res.status(400).json({
        error: 'Erro de validação',
        details,
      })
    }
    // Substitui com a versão parseada (coerções aplicadas pelo schema)
    ;(req as any)[location] = result.data
    next()
  }
}

export const validateBody = (schema: ZodTypeAny) => makeValidator(schema, 'body')
export const validateQuery = (schema: ZodTypeAny) => makeValidator(schema, 'query')
export const validateParams = (schema: ZodTypeAny) => makeValidator(schema, 'params')


