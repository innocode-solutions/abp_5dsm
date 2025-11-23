# Script para testar a execução do container Docker localmente
# Este script testa se o container inicia corretamente após o build

param(
    [string]$ImageName = "abp-backend-test:latest",
    [string]$Port = "8080",
    [switch]$WithDatabase = $false
)

Write-Host "🚀 Testando execução do container Docker..." -ForegroundColor Cyan
Write-Host ""

# Verificar se a imagem existe
Write-Host "1️⃣ Verificando se a imagem existe..." -ForegroundColor Yellow
$imageExists = docker image inspect $ImageName 2>$null
if (-not $imageExists) {
    Write-Host "❌ Imagem '$ImageName' não encontrada!" -ForegroundColor Red
    Write-Host "   Execute primeiro: .\scripts\test-docker-build.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Imagem encontrada" -ForegroundColor Green
Write-Host ""

# Verificar se o Docker está rodando
try {
    docker ps > $null 2>&1
} catch {
    Write-Host "❌ Docker daemon não está rodando!" -ForegroundColor Red
    exit 1
}

# Variáveis de ambiente mínimas para teste
$envVars = @(
    "NODE_ENV=test",
    "PORT=$Port",
    "HTTP_PORT=$Port",
    "JWT_SECRET=test-secret-key-for-local-testing-only",
    "JWT_EXPIRES_IN=7d"
)

# Se o usuário quiser testar com banco de dados
if ($WithDatabase) {
    Write-Host "2️⃣ Iniciando banco de dados PostgreSQL..." -ForegroundColor Yellow
    docker-compose -f docker-compose.yml up -d postgres
    
    # Aguardar o banco estar pronto
    Write-Host "   Aguardando banco de dados ficar pronto..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    $envVars += "DATABASE_URL=postgresql://abp_user:abp_password@localhost:5432/academic_management"
    Write-Host "✅ Banco de dados iniciado" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "2️⃣ Testando sem banco de dados (apenas verificação de inicialização)" -ForegroundColor Yellow
    Write-Host "   Use -WithDatabase para testar com banco de dados completo" -ForegroundColor Gray
    $envVars += "DATABASE_URL=postgresql://test:test@localhost:5432/test"
    Write-Host ""
}

# Construir comando docker run
$envString = ($envVars | ForEach-Object { "-e $_" }) -join " "

Write-Host "3️⃣ Iniciando container..." -ForegroundColor Yellow
Write-Host "   Imagem: $ImageName" -ForegroundColor Gray
Write-Host "   Porta: $Port" -ForegroundColor Gray
Write-Host ""

# Executar o container em modo interativo para ver os logs
Write-Host "📋 Logs do container (Ctrl+C para parar):" -ForegroundColor Cyan
Write-Host ""

try {
    docker run --rm `
        -p "${Port}:${Port}" `
        $envString `
        $ImageName
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar o container: $_" -ForegroundColor Red
    exit 1
} finally {
    if ($WithDatabase) {
        Write-Host ""
        Write-Host "🛑 Parando banco de dados..." -ForegroundColor Yellow
        docker-compose -f docker-compose.yml stop postgres
    }
}

