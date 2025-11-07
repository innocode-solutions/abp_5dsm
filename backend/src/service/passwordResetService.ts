import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { PasswordResetStatus } from '@prisma/client'
import { prisma } from '../config/database'

const OTP_LENGTH = 6
const OTP_EXPIRATION_MINUTES = 15
const OTP_RATE_LIMIT_PER_HOUR = 3

export class PasswordResetService {
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
    await prisma.passwordResetRequest.updateMany({
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

    const byUserCount = await prisma.passwordResetRequest.count({
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

    const byIpCount = await prisma.passwordResetRequest.count({
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

    await prisma.passwordResetRequest.create({
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
}

