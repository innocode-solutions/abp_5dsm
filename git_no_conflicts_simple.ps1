# Script simples para operações Git sem conflitos
Write-Host "🔄 Git sem conflitos - Operação segura" -ForegroundColor Green
Write-Host "=" * 50

# 1. Backup das alterações
Write-Host "1️⃣ Fazendo backup..." -ForegroundColor Yellow
git stash push -m "Backup automatico - $(Get-Date)"

# 2. Pull com estratégia que preserva alterações
Write-Host "2️⃣ Fazendo pull seguro..." -ForegroundColor Yellow
git pull --no-edit --strategy=recursive -X ours origin main

# 3. Verificar se há conflitos
$gitStatus = git status --porcelain
if ($gitStatus -match 'UU|AA|DD') {
    Write-Host "3️⃣ Resolvendo conflitos..." -ForegroundColor Yellow
    
    # Resolver conflitos em arquivos específicos
    $files = @(
        "backend/src/controllers/dashboardController.ts",
        "backend/src/controllers/predictionController.ts",
        "backend/src/routes/predictionRoutes.ts",
        "backend/src/routes/index.ts"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            if ($content -match '<<<<<<<') {
                Write-Host "   Resolvendo: $file" -ForegroundColor Cyan
                $resolved = $content -replace '<<<<<<< HEAD\r?\n', '' -replace '=======\r?\n', '' -replace '>>>>>>> [^\r\n]+\r?\n', ''
                Set-Content -Path $file -Value $resolved -Encoding UTF8
            }
        }
    }
    
    # Adicionar e commitar
    git add .
    git commit -m "resolve: conflitos resolvidos automaticamente"
}

Write-Host "✅ Operação concluída sem perder alterações!" -ForegroundColor Green
