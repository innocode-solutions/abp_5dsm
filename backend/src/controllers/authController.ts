import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { UserRole } from "@prisma/client";
import {
  PasswordResetInvalidError,
  PasswordResetService,
} from "../service/passwordResetService";
import { sendPasswordResetEmail } from "../service/emailService";

export class AuthController {
  // POST /auth/register
  static async register(req: Request, res: Response) {
    try {
      const { Email, PasswordHash, Role = UserRole.STUDENT, name } = req.body;

      if (!Email || !PasswordHash || !name) {
        return res
          .status(400)
          .json({ error: "Email, senha e nome são obrigatórios" });
      }

      // Verifica se já existe
      const existingUser = await prisma.user.findUnique({
        where: { Email },
      });

      if (existingUser) {
        return res
          .status(409)
          .json({ error: "Usuário já existe com este email" });
      }

      // Cria usuário
      const user = await prisma.user.create({
        data: {
          Email,
          PasswordHash, // já vem do middleware hashPassword
          Role,
          name,
        },
        select: {
          IDUser: true,
          Email: true,
          Role: true,
          name: true,
          createdAt: true,
        },
      });

      res.status(201).json(user);
    } catch (err) {
      console.error("Erro ao registrar usuário:", err);
      res.status(500).json({ error: "Erro interno ao registrar usuário" });
    }
  }

  // POST /auth/login
  static async login(req: Request, res: Response) {
    try {
      const { Email, password } = req.body;

      if (!Email || !password) {
        return res
          .status(400)
          .json({ error: "Email e senha são obrigatórios" });
      }

      const user = await prisma.user.findUnique({
        where: { Email },
        select: {
          IDUser: true,
          Email: true,
          PasswordHash: true,
          Role: true,
          name: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Compara senha
      const isValid = await bcrypt.compare(password, user.PasswordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Busca o aluno associado ao usuário (se houver)
      let studentId: string | undefined = undefined
      if (user.Role === 'STUDENT') {
        const aluno = await prisma.aluno.findFirst({
          where: { IDUser: user.IDUser },
          select: { IDAluno: true }
        })
        if (aluno) {
          studentId = aluno.IDAluno
        }
      }

      // Gera token JWT
      const jwtSecret =
        process.env.JWT_SECRET ||
        "your-super-secret-jwt-key-change-this-in-production"; // retirar ao fazer deploy
      const token = jwt.sign(
        {
          userId: user.IDUser,
          role: user.Role,
          email: user.Email,
          studentId: studentId
        },
        jwtSecret,
        { expiresIn: "1h" } // Token válido por 1 hora
      );

      // Retorna dados do usuário e token
      const { PasswordHash, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token,
        expiresIn: "1h",
      });
    } catch (err: any) {
      console.error("Erro ao realizar login");
      
      // Handle Prisma database connection errors
      if (err?.code === 'P1001' || err?.name === 'PrismaClientInitializationError') {
        return res.status(503).json({ 
          error: "Serviço de banco de dados indisponível. Verifique a conexão com o banco de dados." 
        });
      }
      
      res.status(500).json({ error: "Erro interno ao realizar login" });
    }
  }

  // POST /auth/password/forgot
  static async forgotPassword(req: Request, res: Response) {
    try {
      const email = req.body?.email?.trim();

      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const generationResult = await PasswordResetService.generateAndStoreOtp(
        email,
        req.ip
      );

      if (!generationResult) {
        return res.status(404).json({ error: "E-mail não encontrado" });
      }

      const { user, otp, expiresAt } = generationResult;

      // Em desenvolvimento, logar o código (REMOVER EM PRODUÇÃO)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔑 Código OTP para ${email}: ${otp}`);
      }

      try {
        await sendPasswordResetEmail({
          to: user.Email,
          name: user.name,
          otp,
          expiresAt,
        });
      } catch (mailError) {
        console.error("Falha ao enviar e-mail de redefinição:", mailError);
        // Se SMTP não estiver configurado, retornar erro específico
        return res.status(500).json({ 
          error: "Serviço de e-mail não configurado. Entre em contato com o administrador." 
        });
      }

      // Verificar se SMTP está configurado antes de retornar sucesso
      const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
      if (!hasSmtp) {
        console.warn("⚠️ SMTP não configurado - código gerado mas email não enviado");
        return res.status(503).json({ 
          error: "Serviço de e-mail temporariamente indisponível. Tente novamente mais tarde." 
        });
      }

      res.json({ message: "Código enviado se o e-mail for válido" });
    } catch (err) {
      if (err instanceof Error && err.message === "RATE_LIMITED") {
        return res.status(429).json({
          error: "Limite de solicitações excedido. Tente novamente mais tarde.",
        });
      }

      console.error("Erro ao solicitar redefinição de senha");
      res
        .status(500)
        .json({ error: "Erro interno ao solicitar redefinição de senha" });
    }
  }

  // POST /auth/password/verify-code
  static async verifyResetCode(req: Request, res: Response) {
    try {
      const email =
        typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const code =
        typeof req.body?.code === "string" ? req.body.code.trim() : "";

      if (!email || !code) {
        return res
          .status(400)
          .json({ error: "Email e código são obrigatórios" });
      }

      const verification = await PasswordResetService.verifyOtp(email, code);

      const resetSecret =
        process.env.JWT_RESET_SECRET ||
        process.env.JWT_SECRET ||
        "your-super-secret-jwt-key-change-this-in-production";

      const resetToken = jwt.sign(
        {
          userId: verification.userId,
          email: verification.email,
          type: "password_reset",
        },
        resetSecret,
        { expiresIn: "15m" }
      );

      res.json({ reset_token: resetToken });
    } catch (err) {
      if (err instanceof PasswordResetInvalidError) {
        return res.status(400).json({ error: "Código inválido ou expirado" });
      }

      console.error("Erro ao verificar código de redefinição");
      res.status(500).json({ error: "Erro interno ao verificar código" });
    }
  }

  // GET /auth/me - Verificar token atual
  static async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await prisma.user.findUnique({
        where: { IDUser: req.user.userId },
        select: {
          IDUser: true,
          Email: true,
          Role: true,
          name: true,
          createdAt: true,
          alunos: {
            select: {
              IDAluno: true,
              Nome: true,
              Semestre: true,
              curso: {
                select: {
                  IDCurso: true,
                  NomeDoCurso: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json(user);
    } catch (err) {
      console.error("Erro ao verificar usuário");
      res.status(500).json({ error: "Erro interno ao verificar usuário" });
    }
  }

  // POST /auth/password/reset - Redefinir senha usando email + code (alternativa sem token)
  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword, confirmPassword } = req.body;

      if (!email || !code || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          error: "Email, código, nova senha e confirmação são obrigatórios" 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "As senhas não coincidem" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
      }

      // Verifica o código OTP e marca como usado
      const verification = await PasswordResetService.verifyOtpAndMarkAsUsed(
        email.trim(),
        code.trim()
      );

      // Verifica se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { IDUser: verification.userId },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Hash da nova senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualiza a senha
      await prisma.user.update({
        where: { IDUser: verification.userId },
        data: { PasswordHash: hashedPassword },
      });

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (err) {
      if (err instanceof PasswordResetInvalidError) {
        return res.status(400).json({ error: "Código inválido ou expirado" });
      }
      console.error("Erro ao redefinir senha");
      res.status(500).json({ error: "Erro interno ao redefinir senha" });
    }
  }

  // POST /auth/password/reset-with-token - Redefinir senha usando reset token (alternativa com token)
  static async resetPasswordWithToken(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Token de redefinição inválido" });
      }

      const { newPassword, confirmPassword } = req.body;

      if (!newPassword || !confirmPassword) {
        return res.status(400).json({ error: "Nova senha e confirmação são obrigatórias" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "As senhas não coincidem" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
      }

      const userId = req.user.userId;

      // Verifica se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { IDUser: userId },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Hash da nova senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualiza a senha
      await prisma.user.update({
        where: { IDUser: userId },
        data: { PasswordHash: hashedPassword },
      });

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (err) {
      console.error("Erro ao redefinir senha");
      res.status(500).json({ error: "Erro interno ao redefinir senha" });
    }
  }

  // PUT /auth/:id/password - Atualizar senha
  static async updatePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { PasswordHash } = req.body;

      if (!PasswordHash) {
        return res.status(400).json({ error: "Nova senha é obrigatória" });
      }

      const existingUser = await prisma.user.findUnique({
        where: { IDUser: id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds);

      await prisma.user.update({
        where: { IDUser: id },
        data: { PasswordHash: hashedPassword },
      });

      res.json({ message: "Senha atualizada com sucesso" });
    } catch (err) {
      console.error("Erro ao atualizar senha");
      res.status(500).json({ error: "Erro interno ao atualizar senha" });
    }
  }
}
