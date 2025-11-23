import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { Platform } from "react-native";
import { getToken, clearTokens } from "../service/tokenStore";

// ============================================================================
// CONFIGURAÇÃO DA API - HTTP para mobile, HTTPS para web (quando disponível)
// ============================================================================

function getApiUrl(): string {
  // Porta padrão do backend
  const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || '8080';
  
  // Se EXPO_PUBLIC_API_URL existir → usa ela primeiro, mas SEMPRE força a porta correta
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    try {
      const urlObj = new URL(url);
      // SEMPRE força a porta correta, independente do que estiver na URL
      urlObj.port = BACKEND_PORT;
      return urlObj.toString();
    } catch {
      // Se a URL for inválida, ignora e usa a lógica padrão
    }
  }

  // Se EXPO_PUBLIC_MACHINE_IP existir → monta a URL manual com porta correta
  const machineIp = process.env.EXPO_PUBLIC_MACHINE_IP;
  if (machineIp) {
    return `http://${machineIp}:${BACKEND_PORT}/api`;
  }

  // Android Emulator - sempre HTTP na porta correta
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }

  // iOS Simulator - sempre HTTP na porta correta
  if (Platform.OS === "ios") {
    return `http://localhost:${BACKEND_PORT}/api`;
  }

  // Web - usar HTTP na porta correta
  return `http://localhost:${BACKEND_PORT}/api`;
}

export const API_URL = getApiUrl();


export const apiConnection = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: Attach token and log requests
apiConnection.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Attach token first
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }


    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error');
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors
apiConnection.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle unauthorized errors: clear tokens
    if (error.response?.status === 401) {
      await clearTokens();
    }

    // Only log critical errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message === 'Network Error') {
      console.error('Connection Error: Unable to connect to server');
    } else if (error.response?.status && error.response.status >= 500) {
      console.error('Server Error');
    }

    return Promise.reject(error);
  }
);
