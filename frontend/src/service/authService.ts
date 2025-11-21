import { apiConnection } from "~/api/apiConnection";
import { setToken, clearTokens } from "~/service/tokenStore";
import { disconnectSocket } from "~/service/socketService";

interface LoginRequest {
  Email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  expiresIn: string;
  user: {
    IDUser: string;
    Email: string;
    name: string | null;
    Role: string;
    createdAt: string;
  };
}

interface RegisterRequest {
  Email: string;
  password: string;
  name: string;
  Role?: string;
}

interface RegisterResponse {
  IDUser: string;
  Email: string;
  name: string | null;
  Role: string;
  createdAt: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiConnection.post<LoginResponse>("/auth/login", data);
      
      if (response.data.token) {
        await setToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiConnection.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      disconnectSocket();
    } catch (error) {
      console.warn('Erro ao desconectar WebSocket:', error);
    }
    
    await clearTokens();
  },
};
