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

// Tenta usar variável de ambiente, senão usa o padrão
const API_URL = 'http://:8080/api'; // ← SUBSTITUA pelo seu IP

// Se estiver usando no celular físico, descomente e substitua pelo seu IP:
// const API_URL = 'http://:8080/api'; // ← SUBSTITUA 192.168.1.100 pelo seu IP

export { API_URL };

