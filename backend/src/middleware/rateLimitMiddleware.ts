import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de solicitações excedido. Tente novamente mais tarde.' },
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : 'unknown'
    const rawIp = typeof req.ip === 'string' ? req.ip : undefined
    const ipKey = rawIp ? ipKeyGenerator(rawIp) : 'unknown'
    return `${ipKey}::${email}`
  }
})

