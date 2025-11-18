import axios, { AxiosError } from "axios";
import { Platform } from 'react-native';

// ============================================================================
// CONFIGURAÇÃO DA URL DA API
// ============================================================================
// 
// CONFIGURAÇÃO VIA VARIÁVEIS DE AMBIENTE (RECOMENDADO):
// 
// Crie um arquivo .env na pasta frontend/ com:
// 
// Para Expo Go em dispositivo físico (use apenas o IP):
// EXPO_PUBLIC_MACHINE_IP=192.168.1.100
//
// Para produção/deploy (use URL completa):
// EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api
//
// Como descobrir seu IP:
// Windows: ipconfig | findstr /i "IPv4"
// Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
//
// DETECÇÃO AUTOMÁTICA (quando variáveis não estão configuradas):
// - Android Emulator: http://10.0.2.2:8080/api
// - iOS Simulator: http://localhost:8080/api  
// - Web: http://localhost:8080/api

// Função para detectar a URL da API baseado na plataforma
function getApiUrl(): string {
  // Prioridade 1: Variável de ambiente EXPO_PUBLIC_API_URL (URL completa - para produção/deploy)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Prioridade 2: Variável de ambiente EXPO_PUBLIC_MACHINE_IP (apenas IP - para Expo Go físico)
  // Configure no arquivo .env: EXPO_PUBLIC_MACHINE_IP=192.168.1.100
  const machineIp = process.env.EXPO_PUBLIC_MACHINE_IP;
  if (machineIp) {
    return `http://${machineIp}:8080/api`;
  }
  
  // Prioridade 3: Detecção automática baseada na plataforma
  if (Platform.OS === 'android') {
    // Android Emulator usa 10.0.2.2 para acessar localhost da máquina host
    // Expo Go em dispositivo físico: configure EXPO_PUBLIC_MACHINE_IP no .env
    return 'http://10.0.2.2:8080/api';
  }
  
  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    // iOS Simulator ou Web - usa localhost
    // Expo Go em dispositivo físico iOS: configure EXPO_PUBLIC_MACHINE_IP no .env
    return 'http://localhost:8080/api';
  }
  
  // Fallback: localhost (provavelmente não funcionará)
  console.warn('⚠️ Plataforma não reconhecida, usando localhost como fallback');
  return 'http://localhost:8080/api';
}

// URL da API configurada automaticamente baseada na plataforma
export const API_URL = getApiUrl();

// Log da URL configurada para debug
console.log(`🔗 API URL configurada: ${API_URL} (Platform: ${Platform.OS})`);

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

export const apiConnection = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos (igual ao timeout do backend)
  headers: {
    "Content-Type": "application/json",
  },
});
