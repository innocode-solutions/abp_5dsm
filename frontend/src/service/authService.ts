import { apiConnection } from "~/api/apiConnection";
import { setToken, clearTokens } from "~/service/tokenStore";

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
    const response = await apiConnection.post<LoginResponse>("/auth/login", data);
    await setToken(response.data.token);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiConnection.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await clearTokens();
  },
};
