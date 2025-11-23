import crypto from 'crypto'
import { PasswordResetService } from '../src/service/passwordResetService'
import bcrypt from 'bcrypt'

jest.mock('../src/config/database', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn()
    },
    passwordResetRequest: {
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    }
  }

  return {
    prisma: mockPrisma
  }
})

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed-otp'),
  compare: jest.fn()
}))

const { prisma } = require('../src/config/database')

// Variáveis tipadas para os mocks do bcrypt
const mockedHash = bcrypt.hash as jest.Mock<Promise<string>, [data: string | Buffer, saltOrRounds: string | number]>
const mockedCompare = bcrypt.compare as jest.Mock<Promise<boolean>, [data: string | Buffer, encrypted: string]>

const PasswordResetStatus = {
  PENDING: 'PENDING',
  USED: 'USED',
  EXPIRED: 'EXPIRED'
} as const;

describe('PasswordResetService.generateAndStoreOtp', () => {
  const user = {
    IDUser: 'user-123',
    Email: 'user@example.com',
    name: 'Test User'
  }
  let randomIntSpy: jest.SpyInstance<number, any[]>
  let isRateLimitedSpy: jest.SpyInstance<Promise<boolean>, [userId: string, ipAddress?: string]>

  beforeEach(() => {
    randomIntSpy = jest.spyOn(crypto, 'randomInt') as unknown as jest.SpyInstance<number, any[]>
    randomIntSpy.mockImplementation(() => 123456)
    isRateLimitedSpy = jest.spyOn(PasswordResetService, 'isRateLimited')
    prisma.user.findUnique.mockReset()
    prisma.passwordResetRequest.count.mockReset()
    prisma.passwordResetRequest.updateMany.mockReset()
    prisma.passwordResetRequest.create.mockReset()
    prisma.passwordResetRequest.findFirst.mockReset()
    prisma.passwordResetRequest.update.mockReset()
    mockedHash.mockClear()
    mockedCompare.mockReset()
  })

  afterEach(() => {
    randomIntSpy.mockRestore()
    isRateLimitedSpy.mockRestore()
  })

  it('retorna null quando usuário não existe', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null)

    const result = await PasswordResetService.generateAndStoreOtp('missing@example.com')

    expect(result).toBeNull()
    expect(prisma.passwordResetRequest.create).not.toHaveBeenCalled()
  })

  it('lança erro quando excede limite por usuário ou IP', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(user)
    // Mock do método isRateLimited para retornar true
    isRateLimitedSpy.mockResolvedValueOnce(true)

    await expect(
      PasswordResetService.generateAndStoreOtp(user.Email, '127.0.0.1')
    ).rejects.toThrow('RATE_LIMITED')
    expect(prisma.passwordResetRequest.create).not.toHaveBeenCalled()
  })

  it('cria solicitação de redefinição quando dentro do limite', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(user)
    // Mock do método isRateLimited para retornar false (dentro do limite)
    isRateLimitedSpy.mockResolvedValueOnce(false)
    prisma.passwordResetRequest.updateMany.mockResolvedValueOnce({ count: 1 })
    prisma.passwordResetRequest.create.mockResolvedValueOnce({})

    const result = await PasswordResetService.generateAndStoreOtp(user.Email, '127.0.0.1')

    expect(result).not.toBeNull()
    expect(result?.user).toEqual(user)
    expect(result?.otp).toBe('123456')
    expect(result?.expiresAt.getTime()).toBeGreaterThan(Date.now())

    expect(prisma.passwordResetRequest.updateMany).toHaveBeenCalledWith({
      where: { userId: user.IDUser, status: PasswordResetStatus.PENDING },
      data: { status: PasswordResetStatus.EXPIRED }
    })

    expect(mockedHash).toHaveBeenCalledWith('123456', 12)

    expect(prisma.passwordResetRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.IDUser,
        otpHash: 'hashed-otp',
        expiresAt: expect.any(Date),
        ipAddress: '127.0.0.1',
        attempts: 0,
        status: PasswordResetStatus.PENDING
      })
    })
  })
})

describe('PasswordResetService.verifyOtp', () => {
  const user = {
    IDUser: 'user-123',
    Email: 'user@example.com'
  }
  const requestBase = {
    id: 'req-1',
    userId: user.IDUser,
    otpHash: 'hashed-otp',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    status: PasswordResetStatus.PENDING,
    requestedAt: new Date()
  }

  beforeEach(() => {
    prisma.user.findUnique.mockReset()
    prisma.user.findUnique.mockResolvedValue(user)
    prisma.passwordResetRequest.findFirst.mockReset()
    prisma.passwordResetRequest.update.mockReset()
    mockedCompare.mockReset()
  })

  it('lança erro quando usuário não existe', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null)

    await expect(
      PasswordResetService.verifyOtp('missing@example.com', '123456')
    ).rejects.toThrow('INVALID_OR_EXPIRED')

    expect(prisma.passwordResetRequest.findFirst).not.toHaveBeenCalled()
  })

  it('lança erro quando não há requisição pendente', async () => {
    prisma.passwordResetRequest.findFirst.mockResolvedValueOnce(null)

    await expect(
      PasswordResetService.verifyOtp(user.Email, '123456')
    ).rejects.toThrow('INVALID_OR_EXPIRED')
  })

  it('falha se código expirado', async () => {
    const expiredRequest = {
      ...requestBase,
      expiresAt: new Date(Date.now() - 60 * 1000),
      attempts: 2
    }
    prisma.passwordResetRequest.findFirst.mockResolvedValueOnce(expiredRequest)

    await expect(
      PasswordResetService.verifyOtp(user.Email, '123456')
    ).rejects.toThrow('INVALID_OR_EXPIRED')

    expect(prisma.passwordResetRequest.update).toHaveBeenCalledWith({
      where: { id: expiredRequest.id },
      data: expect.objectContaining({
        attempts: expiredRequest.attempts + 1,
        status: PasswordResetStatus.EXPIRED
      })
    })
  })

  it('falha se código incorreto e incrementa tentativas', async () => {
    const request = {
      ...requestBase,
      attempts: 1
    }
    prisma.passwordResetRequest.findFirst.mockResolvedValueOnce(request)
    mockedCompare.mockResolvedValueOnce(false)

    await expect(
      PasswordResetService.verifyOtp(user.Email, '000000')
    ).rejects.toThrow('INVALID_OR_EXPIRED')

    expect(mockedCompare).toHaveBeenCalledWith('000000', request.otpHash)
    expect(prisma.passwordResetRequest.update).toHaveBeenCalledWith({
      where: { id: request.id },
      data: expect.objectContaining({
        attempts: request.attempts + 1,
        status: PasswordResetStatus.PENDING
      })
    })
  })

  it('falha e bloqueia após 5 tentativas', async () => {
    const request = {
      ...requestBase,
      attempts: 5
    }
    prisma.passwordResetRequest.findFirst.mockResolvedValueOnce(request)

    await expect(
      PasswordResetService.verifyOtp(user.Email, '123456')
    ).rejects.toThrow('INVALID_OR_EXPIRED')

    expect(prisma.passwordResetRequest.update).toHaveBeenCalledWith({
      where: { id: request.id },
      data: { status: PasswordResetStatus.EXPIRED }
    })
  })

  it('retorna dados ao validar código corretamente', async () => {
    const request = {
      ...requestBase,
      attempts: 2
    }
    prisma.passwordResetRequest.findFirst.mockResolvedValueOnce(request)
    mockedCompare.mockResolvedValueOnce(true)

    const result = await PasswordResetService.verifyOtp(user.Email, '123456')

    expect(result).toEqual({
      userId: user.IDUser,
      email: user.Email,
      requestId: request.id
    })

    // verifyOtp incrementa tentativas mas mantém status PENDING (não marca como USED)
    expect(prisma.passwordResetRequest.update).toHaveBeenCalledWith({
      where: { id: request.id },
      data: {
        attempts: request.attempts + 1,
        // status não é alterado, mantém PENDING
      }
    })
  })
})


