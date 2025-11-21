import axios from "axios";
import { Platform } from "react-native";

// ============================================================================
// CONFIGURAÇÃO DA API - HTTP para mobile, HTTPS para web (quando disponível)
// ============================================================================

function getApiUrl(): string {
  // Se EXPO_PUBLIC_API_URL existir → usa ela primeiro
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Se EXPO_PUBLIC_MACHINE_IP existir → monta a URL manual
  const machineIp = process.env.EXPO_PUBLIC_MACHINE_IP;
  if (machineIp) {
    // ✅ Na web, tentar HTTPS primeiro, depois HTTP
    if (Platform.OS === 'web') {
      // Tentar HTTPS primeiro (porta 8443 padrão)
      const httpsPort = process.env.EXPO_PUBLIC_HTTPS_PORT || '8443';
      // Se falhar, o axios vai tentar HTTP automaticamente ou podemos usar HTTP direto
      // Por enquanto, vamos usar HTTP mesmo na web para evitar problemas de certificado
      return `http://${machineIp}:3333/api`;
    }
    return `http://${machineIp}:3333/api`;
  }

  // Android Emulator - sempre HTTP
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3333/api";
  }

  // iOS Simulator - sempre HTTP
  if (Platform.OS === "ios") {
    return "http://localhost:3333/api";
  }

  // Web - usar HTTP (HTTPS pode causar problemas com certificados self-signed)
  // Se quiser usar HTTPS na web, descomente e configure certificados válidos:
  // return "https://localhost:8443/api";
  return "http://localhost:3333/api";
}

export const API_URL = getApiUrl();

console.log(`🔗 API URL configurada: ${API_URL} (Platform: ${Platform.OS})`);

export const apiConnection = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});
