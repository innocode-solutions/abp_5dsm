import { apiConnection } from "../api/apiConnection";

const API_BASE_URL = "http://localhost:8080/api";

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

class PasswordResetService {
  /**
   * Step 1: Request password reset code
   * POST /auth/password/forgot
   */
  static async requestResetCode(
    email: string
  ): Promise<ForgotPasswordResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email } as ForgotPasswordRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao enviar código");
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || "Código enviado com sucesso",
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Erro ao conectar com o servidor"
      );
    }
  }

  /**
   * Step 2: Verify the reset code
   * POST /auth/password/verify-code
   */
  static async verifyResetCode(
    email: string,
    code: string
  ): Promise<VerifyCodeResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/password/verify-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code } as VerifyCodeRequest),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Código inválido ou expirado");
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || "Código verificado com sucesso",
        token: data.token,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Erro ao verificar código"
      );
    }
  }

  /**
   * Step 3: Reset password
   * POST /auth/password/reset
   */
  static async resetPassword(
    email: string,
    code: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ResetPasswordResponse> {
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (newPassword.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }

      const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
          confirmPassword,
        } as ResetPasswordRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao redefinir senha");
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || "Senha redefinida com sucesso",
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Erro ao redefinir senha"
      );
    }
  }
}

export default PasswordResetService;
