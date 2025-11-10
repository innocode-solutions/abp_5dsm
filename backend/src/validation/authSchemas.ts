import { z } from 'zod'

export const authRegisterSchema = z.object({
  Email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128, 'Senha muito longa'),
  Role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).optional(),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(120, 'Nome muito longo')
}).passthrough()

export const authLoginSchema = z.object({
  Email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  password: z.string()
    .min(1, 'Senha é obrigatória')
    .max(128, 'Senha muito longa')
}).passthrough()

export const forgotPasswordSchema = z.object({
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email muito longo')
}).strict()

export const verifyResetCodeSchema = z.object({
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  code: z.string()
    .trim()
    .regex(/^\d{6}$/, 'Código deve conter 6 dígitos')
}).strict()


