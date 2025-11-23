# Script para testar o build do Docker localmente
# Este script testa se o Dockerfile está configurado corretamente antes do deploy no Railway

Write-Host "🐳 Testando build do Docker localmente..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o Docker está rodando
Write-Host "1️⃣ Verificando se o Docker está rodando..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está instalado ou não está rodando!" -ForegroundColor Red
    Write-Host "   Por favor, instale o Docker Desktop e tente novamente." -ForegroundColor Red
    exit 1
}

# Verificar se o Docker daemon está acessível
try {
    docker ps > $null 2>&1
    Write-Host "✅ Docker daemon está acessível" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon não está rodando!" -ForegroundColor Red
    Write-Host "   Por favor, inicie o Docker Desktop e tente novamente." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Navegar para o diretório do backend
$backendDir = Split-Path -Parent $PSScriptRoot
Set-Location $backendDir

Write-Host "2️⃣ Diretório de trabalho: $backendDir" -ForegroundColor Yellow
Write-Host ""

# Verificar se o Dockerfile existe
if (-not (Test-Path "Dockerfile")) {
    Write-Host "❌ Dockerfile não encontrado em $backendDir" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dockerfile encontrado" -ForegroundColor Green
Write-Host ""

# Verificar se o requirements.txt existe
if (-not (Test-Path "requirements.txt")) {
    Write-Host "⚠️  requirements.txt não encontrado (opcional para teste de build)" -ForegroundColor Yellow
} else {
    Write-Host "✅ requirements.txt encontrado" -ForegroundColor Green
}
Write-Host ""

# Limpar builds anteriores (opcional)
Write-Host "3️⃣ Limpando builds anteriores (opcional)..." -ForegroundColor Yellow
docker image rm abp-backend-test 2>$null
Write-Host "✅ Limpeza concluída" -ForegroundColor Green
Write-Host ""

# Fazer o build
Write-Host "4️⃣ Iniciando build do Docker..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos (especialmente a instalação do Python e dependências ML)..." -ForegroundColor Gray
Write-Host ""

$buildStartTime = Get-Date

try {
    docker build `
        -t abp-backend-test:latest `
        -f Dockerfile `
        . 2>&1 | Tee-Object -Variable buildOutput
    
    $buildEndTime = Get-Date
    $buildDuration = $buildEndTime - $buildStartTime
    
    # Verificar se o build foi bem-sucedido
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
        Write-Host "   Tempo de build: $($buildDuration.TotalMinutes.ToString('F2')) minutos" -ForegroundColor Gray
        Write-Host ""
        
        # Verificar se a imagem foi criada
        $imageExists = docker image inspect abp-backend-test:latest 2>$null
        if ($imageExists) {
            Write-Host "✅ Imagem 'abp-backend-test:latest' criada com sucesso" -ForegroundColor Green
            Write-Host ""
            
            # Mostrar informações da imagem
            Write-Host "5️⃣ Informações da imagem:" -ForegroundColor Yellow
            docker image inspect abp-backend-test:latest --format='{{.Size}}' | ForEach-Object {
                $sizeMB = [math]::Round($_ / 1MB, 2)
                Write-Host "   Tamanho: $sizeMB MB" -ForegroundColor Gray
            }
            Write-Host ""
            
            Write-Host "🎉 Teste de build concluído com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Próximos passos:" -ForegroundColor Cyan
            Write-Host "  1. A imagem está pronta para ser testada localmente" -ForegroundColor Gray
            Write-Host "  2. Você pode fazer commit e push para o Railway" -ForegroundColor Gray
            Write-Host "  3. Para testar a execução, use:" -ForegroundColor Gray
            Write-Host "     docker run --rm -p 8080:8080 -e DATABASE_URL='postgresql://...' -e JWT_SECRET='test' abp-backend-test:latest" -ForegroundColor DarkGray
            Write-Host ""
        } else {
            Write-Host "⚠️  Build concluído, mas a imagem não foi encontrada" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "❌ Build falhou!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Erros encontrados:" -ForegroundColor Yellow
        Write-Host $buildOutput -ForegroundColor Red
        Write-Host ""
        Write-Host "Dicas para resolver:" -ForegroundColor Cyan
        Write-Host "  - Verifique se todas as dependências estão corretas" -ForegroundColor Gray
        Write-Host "  - Verifique se o cmake e llvm foram instalados corretamente" -ForegroundColor Gray
        Write-Host "  - Verifique os logs acima para mais detalhes" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro durante o build: $_" -ForegroundColor Red
    exit 1
}

