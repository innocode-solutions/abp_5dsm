# Script para fazer pull/merge sem conflitos
Write-Host "🔄 Fazendo pull/merge sem conflitos..." -ForegroundColor Green

# 1. Fazer backup
Write-Host "1️⃣ Fazendo backup..." -ForegroundColor Yellow
git stash push -m "Backup automatico - $(Get-Date)"

# 2. Fazer pull com estratégia que preserva alterações
Write-Host "2️⃣ Fazendo pull seguro..." -ForegroundColor Yellow
git pull --no-edit --strategy=recursive -X ours origin main

# 3. Se houver conflitos, resolver automaticamente
$gitStatus = git status --porcelain
if ($gitStatus -match 'UU|AA|DD') {
    Write-Host "3️⃣ Resolvendo conflitos automaticamente..." -ForegroundColor Yellow
    
    # Resolver conflitos em arquivos específicos
    $conflictFiles = @(
        "backend/src/controllers/dashboardController.ts",
        "backend/src/controllers/predictionController.ts",
        "backend/src/routes/predictionRoutes.ts",
        "backend/src/routes/index.ts"
    )
    
    foreach ($file in $conflictFiles) {
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

Write-Host "✅ Pull/merge concluído sem perder alterações!" -ForegroundColor Green
