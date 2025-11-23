import nodemailer, { type Transporter } from 'nodemailer'

interface PasswordResetEmailParams {
  to: string
  name?: string | null
  otp: string
  expiresAt: Date
}

let cachedTransporter: Transporter | null | undefined

function hasSmtpConfig(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT)
}

function getDefaultFrom(): string {
  return process.env.OTP_EMAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com'
}

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) {
    return cachedTransporter
  }

  if (!hasSmtpConfig()) {
    cachedTransporter = null
    return cachedTransporter
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  })

  return cachedTransporter
}

export async function sendPasswordResetEmail({ to, name, otp, expiresAt }: PasswordResetEmailParams): Promise<void> {
  const transporter = getTransporter()
  const subject = 'Código de redefinição de senha'
  const formattedExpires = expiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const greeting = name ? `Olá, ${name}!` : 'Olá!'
  const html = `
    <p>${greeting}</p>
    <p>Recebemos uma solicitação para redefinir a sua senha.</p>
    <p><strong>Seu código é: ${otp}</strong></p>
    <p>Ele expira às ${formattedExpires} (em 15 minutos).</p>
    <p>Se você não solicitou, ignore este e-mail.</p>
  `

  if (!transporter) {
    // SMTP não configurado - apenas retorna sucesso sem enviar
    return;
  }

  await transporter.sendMail({
    from: getDefaultFrom(),
    to,
    subject,
    html
  })
}

