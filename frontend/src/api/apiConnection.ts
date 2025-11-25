import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { Platform } from "react-native";
import { getToken, clearTokens } from "../service/tokenStore";

// ============================================================================
// CONFIGURAÇÃO DA API - HTTP para mobile, HTTPS para web (quando disponível)
// ============================================================================

function getApiUrl(): string {
  // Porta padrão do backend (SEMPRE 8080, nunca 3000)
  const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || '8080';

  // PRIORIDADE 1: Se EXPO_PUBLIC_MACHINE_IP existir → monta a URL manual (desenvolvimento local)
  // Isso tem prioridade sobre EXPO_PUBLIC_API_URL para garantir que use o IP local
  const machineIp = process.env.EXPO_PUBLIC_MACHINE_IP;
  if (machineIp) {
    const url = `http://${machineIp}:${BACKEND_PORT}/api`;
    console.log('🔗 Usando IP local:', url);
    return url;
  }

  // PRIORIDADE 2: Se EXPO_PUBLIC_API_URL existir → usa ela diretamente (produção/Railway)
  // O Railway fornece a URL completa com protocolo, domínio e porta corretos
  // PRIORIDADE 2: Se EXPO_PUBLIC_API_URL existir → usa ela diretamente (produção/Railway)
  // O Railway fornece a URL completa com protocolo, domínio e porta corretos
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    // Garante que termina com /api
    const finalUrl = url.endsWith('/')
      ? `${url}api`
      : url.endsWith('/api')
        ? url
        : `${url}/api`;

    console.log('🔗 Usando API URL:', finalUrl);
    return finalUrl;
  }

  // PRIORIDADE 3: Android Emulator - sempre HTTP na porta 8080
  if (Platform.OS === "android") {
    const url = `http://10.0.2.2:${BACKEND_PORT}/api`;
    console.log('🔗 Usando Android Emulator:', url);
    return url;
  }

  // PRIORIDADE 4: iOS Simulator - sempre HTTP na porta 8080
  if (Platform.OS === "ios") {
    const url = `http://localhost:${BACKEND_PORT}/api`;
    console.log('🔗 Usando iOS Simulator:', url);
    return url;
  }

  // PRIORIDADE 5: Web - usar HTTP na porta 8080
  const url = `http://localhost:${BACKEND_PORT}/api`;
  console.log('🔗 Usando Web:', url);
  return url;
}

export const API_URL = getApiUrl();

// Debug: Log da URL sendo usada (remover em produção)
if (__DEV__) {
  console.log('🔗 API URL configurada:', API_URL);
  console.log('📱 EXPO_PUBLIC_MACHINE_IP:', process.env.EXPO_PUBLIC_MACHINE_IP || 'não definido');
  console.log('🔌 EXPO_PUBLIC_BACKEND_PORT:', process.env.EXPO_PUBLIC_BACKEND_PORT || '8080 (padrão)');
}

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