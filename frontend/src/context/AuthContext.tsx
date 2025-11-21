import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { authService } from "~/service/authService";
import { isTokenValid } from "~/service/tokenValidator";
import { clearTokens } from "~/service/tokenStore";
import { Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';

interface User {
  IDUser: string;
  Email: string;
  name: string | null;
  Role?: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const valid = await isTokenValid();
      if (!valid) {
        await clearTokens();
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (Email: string, password: string) => {
    try {
      const response = await authService.login({ Email, password });
      
      setUser({
        IDUser: response.user.IDUser,
        Email: response.user.Email,
        name: response.user.name,
        Role: response.user.Role,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      // ✅ Limpar estado primeiro para evitar tentativas de reconexão
      setUser(null);
      setIsLoading(false);
      
      // ✅ Chamar logout do serviço (que desconecta WebSocket e limpa tokens)
      await authService.logout();
      
      // ✅ Na web, forçar atualização
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Disparar evento para notificar mudança de estado
        window.dispatchEvent(new Event('auth-logout'));
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, garantir que o estado seja limpo
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
