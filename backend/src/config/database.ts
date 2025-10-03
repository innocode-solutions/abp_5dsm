import { PrismaClient } from '@prisma/client'

declare global {
    // Necessário para evitar erro de tipo no globalThis em TS
    var prisma: PrismaClient | undefined
}

export const prisma =
    globalThis.prisma ??
    new PrismaClient({
        log: ['query', 'error', 'warn'],
    })

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma
}

export default prisma;