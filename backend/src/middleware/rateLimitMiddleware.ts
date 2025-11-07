import rateLimit from 'express-rate-limit'

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de solicitações excedido. Tente novamente mais tarde.' },
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : 'unknown'
    return `${req.ip || 'unknown'}::${email}`
  }
})

