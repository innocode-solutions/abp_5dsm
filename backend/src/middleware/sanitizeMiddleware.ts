import type { Request, Response, NextFunction } from 'express'

function removeScriptTags(input: string): string {
  // Remove <script>...</script> e variações comuns
  const withoutTags = input.replace(/<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gis, '')
  // Remove on* handlers (onload=, onclick=, etc.)
  const withoutHandlers = withoutTags.replace(/on[a-z]+\s*=\s*(["']).*?\1/gi, '')
  // Neutraliza javascript: em URLs
  const withoutJsProto = withoutHandlers.replace(/javascript:\s*/gi, '')
  return withoutJsProto
}

function stripDangerousSqlSequences(input: string): string {
  // Remove sequências comuns de injeção; Prisma usa queries parametrizadas,
  // mas prevenimos strings maliciosas triviais.
  return input
    .replace(/(--|;)/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/@@/g, '@')
}

function sanitizeString(value: string): string {
  let s = value
  // Remove caracteres de controle (exceto \n, \r, \t)
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
  // Trim e normalização básica de espaços
  s = s.trim().replace(/\s{2,}/g, ' ')
  // Remoções específicas
  s = removeScriptTags(s)
  s = stripDangerousSqlSequences(s)
  return s
}

function sanitizeInputDeep<T>(value: T): T {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    return sanitizeString(value) as unknown as T
  }
  if (Array.isArray(value)) {
    return (value as unknown as unknown[])?.map(v => sanitizeInputDeep(v)) as unknown as T
  }
  if (value instanceof Date || Buffer.isBuffer(value)) {
    return value
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeInputDeep(v as unknown)
    }
    return out as unknown as T
  }
  return value
}

function sanitizeInPlace(target: any) {
  if (!target || typeof target !== 'object') return
  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      const v = target[i]
      if (typeof v === 'string') target[i] = sanitizeString(v)
      else if (v && typeof v === 'object') sanitizeInPlace(v)
    }
    return
  }
  for (const key of Object.keys(target)) {
    const v = target[key]
    if (typeof v === 'string') target[key] = sanitizeString(v)
    else if (v && typeof v === 'object') sanitizeInPlace(v)
  }
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    if (typeof req.body === 'string') {
      // Body bruto como string (pouco comum com express.json)
      (req as any).body = sanitizeString(req.body)
    } else {
      sanitizeInPlace(req.body)
    }
  }
  // req.query e req.params possuem apenas getter em Express 5: mutar em lugar
  if (req.query) sanitizeInPlace(req.query as any)
  if (req.params) sanitizeInPlace(req.params as any)
  next()
}

export default sanitizeRequest


