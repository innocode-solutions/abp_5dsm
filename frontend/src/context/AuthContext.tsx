import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "~/service/authService";
import { isTokenValid } from "~/service/tokenValidator";
import { clearTokens } from "~/service/tokenStore";

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

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

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
