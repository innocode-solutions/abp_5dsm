# Script PowerShell para build APK apontando para backend local
# Uso: .\scripts\build-local.ps1 [IP_LOCAL]

param(
    [string]$LocalIP = ""
)

Write-Host "🔍 Detectando IP local..." -ForegroundColor Cyan

# Detecta o IP local automaticamente se não fornecido
if ([string]::IsNullOrEmpty($LocalIP)) {
    $adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -like "*Wi-Fi*" -or 
        $_.InterfaceAlias -like "*Ethernet*" -or
        $_.InterfaceAlias -like "*LAN*"
    } | Where-Object { $_.IPAddress -notlike "127.*" }
    
    if ($adapters) {
        $LocalIP = $adapters[0].IPAddress
    } else {
        Write-Host "❌ Não foi possível detectar o IP automaticamente." -ForegroundColor Red
        Write-Host "Por favor, forneça o IP manualmente:" -ForegroundColor Yellow
        Write-Host "  .\scripts\build-local.ps1 -LocalIP 192.168.1.100" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ IP detectado: $LocalIP" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Configurando variáveis de ambiente no EAS..." -ForegroundColor Cyan
Write-Host ""

# Configura o IP no EAS
$result = eas secret:create --scope project --name EXPO_PUBLIC_MACHINE_IP --value $LocalIP --type string --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ IP configurado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Iniciando build..." -ForegroundColor Cyan
    Write-Host ""
    eas build --platform android --profile local
} else {
    Write-Host "❌ Erro ao configurar o IP no EAS" -ForegroundColor Red
    exit 1
}

