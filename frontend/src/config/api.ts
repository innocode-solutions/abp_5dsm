// Configuração da URL da API
// 
// IMPORTANTE: Para usar no celular físico, você precisa substituir 'localhost' 
// pelo IP da sua máquina na rede local.
//
// Como descobrir seu IP:
// Windows: Execute no PowerShell: ipconfig | findstr /i "IPv4"
// Mac/Linux: Execute: ifconfig | grep "inet " | grep -v 127.0.0.1
//
// Exemplo: Se seu IP for 192.168.1.100, use: http://192.168.1.100:8080/api
//
// Para desenvolvimento local (emulador/simulador):
// - Android Emulator: use http://10.0.2.2:8080/api
// - iOS Simulator: use http://localhost:8080/api
// - Web: use http://localhost:8080/api

// URL da API - substitua pelo seu IP se necessário
// Para celular físico: use o IP da sua máquina (ex: http://192.168.15.10:8080/api)
// Para emulador Android: use http://10.0.2.2:8080/api
// Para iOS Simulator/Web: use http://localhost:8080/api
const API_URL = 'http://192.168.15.10:8080/api'; // ← SUBSTITUA pelo seu IP se necessário

export { API_URL };
