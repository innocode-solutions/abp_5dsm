import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from "axios";
import { API_URL } from "../config/api";

// Para React Native, use o IP da sua máquina em vez de localhost
// No Android emulador, use 10.0.2.2 em vez de localhost
// No iOS simulador, use localhost normalmente
// Para dispositivo físico, use o IP da sua máquina na rede local

export const apiConnection = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiConnection.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiConnection.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);
