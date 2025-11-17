import axios from "axios"
import { API_URL } from "../config/api"

export const apiConnection = axios.create({
  baseURL: API_URL,
import axios from "axios";

// Para React Native, use o IP da sua máquina em vez de localhost
// No Android emulador, use 10.0.2.2 em vez de localhost
// No iOS simulador, use localhost normalmente
// Para dispositivo físico, use o IP da sua máquina na rede local
const API_BASE_URL = __DEV__
  ? "http://localhost:8080/api" // ou "http://10.0.2.2:8080/api" para Android emulador
  : "http://localhost:8080/api"; // Ajuste para sua URL de produção

export const apiConnection = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiConnection.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiConnection.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
