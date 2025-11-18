import { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { apiConnection } from "../api/apiConnection";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@mentora:token";

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// Request interceptor: Attach token and log requests
apiConnection.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Attach token first
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 2. Log the request
    console.log(`📤 Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor: Log responses and handle errors
apiConnection.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses
    console.log(`✅ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    // Log detailed error information for debugging
    if (error.code === 'ECONNABORTED') {
      console.error(`⏱️ Timeout: A requisição para ${error.config?.url} excedeu o tempo limite`);
      console.error(`   URL completa: ${error.config?.baseURL}${error.config?.url}`);
      console.error(`   Verifique se o backend está rodando e acessível`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error(`🔌 Connection Error: Não foi possível conectar ao servidor`);
      console.error(`   URL: ${error.config?.baseURL}${error.config?.url}`);
      console.error(`   Verifique se o backend está rodando e acessível`);
    } else if (error.response) {
      console.error(`❌ Response Error: ${error.response.status} ${error.response.statusText}`);
      console.error(`   URL: ${error.config?.baseURL}${error.config?.url}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Handle unauthorized errors: clear tokens
    if (error.response?.status === 401) {
      await clearTokens();
    }
    
    return Promise.reject(error);
  }
);
