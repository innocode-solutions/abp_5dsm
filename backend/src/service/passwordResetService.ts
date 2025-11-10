import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../config/database'

const OTP_LENGTH = 6
const OTP_EXPIRATION_MINUTES = 15
const OTP_RATE_LIMIT_PER_HOUR = 3
const OTP_MAX_ATTEMPTS = 5
const PasswordResetStatus = {
  PENDING: 'PENDING',
  USED: 'USED',
  EXPIRED: 'EXPIRED'
} as const
type PasswordResetStatusValue = (typeof PasswordResetStatus)[keyof typeof PasswordResetStatus]

export class PasswordResetInvalidError extends Error {
  constructor() {
    super('INVALID_OR_EXPIRED')
    this.name = 'PasswordResetInvalidError'
  }
}

export class PasswordResetService {
  private static get repository() {
    return (prisma as any).passwordResetRequest
  }

  private static generateNumericCode(): string {
    const max = 10 ** OTP_LENGTH
    const otp = crypto.randomInt(0, max)
    return otp.toString().padStart(OTP_LENGTH, '0')
  }

  private static async hashOtp(otp: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(otp, saltRounds)
  }

  private static getExpirationDate(): Date {
    const expires = new Date()
    expires.setMinutes(expires.getMinutes() + OTP_EXPIRATION_MINUTES)
    return expires
  }

  private static async invalidatePendingRequests(userId: string) {
    await this.repository.updateMany({
      where: {
        userId,
        status: PasswordResetStatus.PENDING
      },
      data: {
        status: PasswordResetStatus.EXPIRED
      }
    })
  }

  static async isRateLimited(userId: string, ipAddress?: string): Promise<boolean> {
    const since = new Date(Date.now() - 60 * 60 * 1000)

    const byUserCount = await this.repository.count({
      where: {
        userId,
        requestedAt: {
          gte: since
        }
      }
    })

    if (byUserCount >= OTP_RATE_LIMIT_PER_HOUR) {
      return true
    }

    if (!ipAddress) {
      return false
    }

    const byIpCount = await this.repository.count({
      where: {
        ipAddress,
        requestedAt: {
          gte: since
        }
      }
    })

    return byIpCount >= OTP_RATE_LIMIT_PER_HOUR
  }

  static async generateAndStoreOtp(email: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { Email: email },
      select: {
        IDUser: true,
        Email: true,
        name: true
      }
    })

    if (!user) {
      return null
    }

    const rateLimited = await this.isRateLimited(user.IDUser, ipAddress)

    if (rateLimited) {
      throw new Error('RATE_LIMITED')
    }

    await this.invalidatePendingRequests(user.IDUser)

    const otp = this.generateNumericCode()
    const otpHash = await this.hashOtp(otp)
    const expiresAt = this.getExpirationDate()

    await this.repository.create({
      data: {
        userId: user.IDUser,
        otpHash,
        expiresAt,
        ipAddress,
        attempts: 0,
        status: PasswordResetStatus.PENDING
      }
    })

    return {
      user,
      otp,
      expiresAt
    }
  }

  private static async registerFailedAttempt(
    requestId: string,
    currentAttempts: number,
    overrideStatus?: PasswordResetStatusValue
  ) {
    const nextAttempts = Math.min(OTP_MAX_ATTEMPTS, currentAttempts + 1)
    await this.repository.update({
      where: { id: requestId },
      data: {
        attempts: nextAttempts,
        status:
          overrideStatus ??
          (nextAttempts >= OTP_MAX_ATTEMPTS ? PasswordResetStatus.EXPIRED : PasswordResetStatus.PENDING)
      }
    })
  }

  static async verifyOtp(email: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { Email: email },
      select: {
        IDUser: true,
        Email: true
      }
    })

    if (!user) {
      throw new PasswordResetInvalidError()
    }

    const request = await this.repository.findFirst({
      where: {
        userId: user.IDUser,
        status: PasswordResetStatus.PENDING
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    if (!request) {
      throw new PasswordResetInvalidError()
    }

    if (request.attempts >= OTP_MAX_ATTEMPTS) {
      if (request.status === PasswordResetStatus.PENDING) {
        await this.repository.update({
          where: { id: request.id },
          data: { status: PasswordResetStatus.EXPIRED }
        })
      }
      throw new PasswordResetInvalidError()
    }

    const now = new Date()
    if (request.expiresAt <= now) {
      await this.registerFailedAttempt(request.id, request.attempts, PasswordResetStatus.EXPIRED)
      throw new PasswordResetInvalidError()
    }

    const isValid = await bcrypt.compare(otp, request.otpHash)

    if (!isValid) {
      await this.registerFailedAttempt(request.id, request.attempts)
      throw new PasswordResetInvalidError()
    }

    await this.repository.update({
      where: { id: request.id },
      data: {
        attempts: request.attempts + 1,
        status: PasswordResetStatus.USED
      }
    })

    return {
      userId: user.IDUser,
      email: user.Email,
      requestId: request.id
    }
  }
}

