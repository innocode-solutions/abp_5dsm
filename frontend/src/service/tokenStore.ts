import { AxiosError, InternalAxiosRequestConfig } from "axios";
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

// Attach token to every request
apiConnection.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);


apiConnection.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // If unauthorized, clear tokens and reject
    if (error.response?.status === 401) {
      await clearTokens();
    }
    return Promise.reject(error);
  }
);
