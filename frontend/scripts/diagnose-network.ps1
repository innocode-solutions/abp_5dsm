# Script de Diagnóstico de Rede
# Verifica se tudo está configurado corretamente para conexão local

Write-Host "🔍 Diagnóstico de Rede - Backend Local" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar IP Local
Write-Host "1️⃣ Detectando IP local..." -ForegroundColor Yellow
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -like "*Wi-Fi*" -or 
    $_.InterfaceAlias -like "*Ethernet*" -or
    $_.InterfaceAlias -like "*LAN*"
} | Where-Object { $_.IPAddress -notlike "127.*" }

if ($adapters) {
    $localIP = $adapters[0].IPAddress
    Write-Host "   ✅ IP Local: $localIP" -ForegroundColor Green
} else {
    Write-Host "   ❌ Não foi possível detectar o IP" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Verificar se backend está rodando
Write-Host "2️⃣ Verificando se backend está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend está rodando na porta 8080" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend NÃO está rodando ou não está acessível" -ForegroundColor Red
    Write-Host "   💡 Inicie o backend: cd backend && npm start" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar configuração no EAS
Write-Host "3️⃣ Verificando configuração no EAS..." -ForegroundColor Yellow
$easSecrets = eas secret:list 2>&1
if ($LASTEXITCODE -eq 0) {
    if ($easSecrets -match "EXPO_PUBLIC_MACHINE_IP") {
        Write-Host "   ✅ EXPO_PUBLIC_MACHINE_IP está configurado" -ForegroundColor Green
        $ipLine = $easSecrets | Select-String "EXPO_PUBLIC_MACHINE_IP"
        Write-Host "   $ipLine" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ EXPO_PUBLIC_MACHINE_IP NÃO está configurado" -ForegroundColor Red
        Write-Host "   💡 Configure com: eas secret:create --scope project --name EXPO_PUBLIC_MACHINE_IP --value $localIP" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Não foi possível verificar secrets do EAS (você está logado?)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Testar conexão do IP local
Write-Host "4️⃣ Testando conexão do IP local..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$localIP:8080/health" -TimeoutSec 2 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend acessível via IP local: http://$localIP:8080" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend NÃO está acessível via IP local" -ForegroundColor Red
    Write-Host "   💡 Verifique o firewall e certifique-se de que a porta 8080 está aberta" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "   IP Local: $localIP" -ForegroundColor White
Write-Host "   URL do Backend: http://$localIP:8080/api" -ForegroundColor White
Write-Host ""
Write-Host "📱 No dispositivo Android, teste no navegador:" -ForegroundColor Cyan
Write-Host "   http://$localIP:8080/health" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Se o teste no navegador funcionar mas o app não:" -ForegroundColor Yellow
Write-Host "   1. Rebuild o APK: npm run build:android:local-network" -ForegroundColor White
Write-Host "   2. Ou configure manualmente: eas secret:create --scope project --name EXPO_PUBLIC_MACHINE_IP --value $localIP --force" -ForegroundColor White

