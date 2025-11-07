import crypto from 'crypto'
import { PasswordResetService } from '../src/service/passwordResetService'
import { PasswordResetStatus } from '@prisma/client'

jest.mock('../src/config/database', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn()
    },
    passwordResetRequest: {
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn()
    }
  }

  return {
    prisma: mockPrisma
  }
})

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed-otp')
}))

const { prisma } = require('../src/config/database')
const bcrypt = require('bcrypt')

describe('PasswordResetService.generateAndStoreOtp', () => {
  const user = {
    IDUser: 'user-123',
    Email: 'user@example.com',
    name: 'Test User'
  }
  let randomIntSpy: jest.SpyInstance<number, any[]>

  beforeEach(() => {
    randomIntSpy = jest.spyOn(crypto, 'randomInt') as unknown as jest.SpyInstance<number, any[]>
    randomIntSpy.mockImplementation(() => 123456)
    prisma.user.findUnique.mockReset()
    prisma.passwordResetRequest.count.mockReset()
    prisma.passwordResetRequest.updateMany.mockReset()
    prisma.passwordResetRequest.create.mockReset()
    bcrypt.hash.mockClear()
  })

  afterEach(() => {
    randomIntSpy.mockRestore()
  })

  it('retorna null quando usuário não existe', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null)

    const result = await PasswordResetService.generateAndStoreOtp('missing@example.com')

    expect(result).toBeNull()
    expect(prisma.passwordResetRequest.create).not.toHaveBeenCalled()
  })

  it('lança erro quando excede limite por usuário ou IP', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(user)
    // Primeiro count por usuário excede
    prisma.passwordResetRequest.count.mockResolvedValueOnce(3)

    await expect(
      PasswordResetService.generateAndStoreOtp(user.Email, '127.0.0.1')
    ).rejects.toThrow('RATE_LIMITED')
    expect(prisma.passwordResetRequest.create).not.toHaveBeenCalled()
  })

  it('cria solicitação de redefinição quando dentro do limite', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(user)
    prisma.passwordResetRequest.count
      .mockResolvedValueOnce(1) // por usuário
      .mockResolvedValueOnce(0) // por IP
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

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 12)

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

