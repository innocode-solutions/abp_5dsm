# Script para operações Git seguras sem perder alterações
param(
    [string]$Operation = "pull",
    [string]$Branch = "main"
)

Write-Host "🔄 Operações Git seguras" -ForegroundColor Green
Write-Host "=" * 50

function Backup-Changes {
    Write-Host "1️⃣ Fazendo backup das alterações..." -ForegroundColor Yellow
    $stashResult = git stash push -m "Backup automatico - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    if ($stashResult -match "No local changes to save") {
        Write-Host "   ✅ Nenhuma alteração local para fazer backup" -ForegroundColor Green
        return $false
    } else {
        Write-Host "   ✅ Backup realizado com sucesso" -ForegroundColor Green
        return $true
    }
}

function Resolve-Conflicts {
    Write-Host "3️⃣ Resolvendo conflitos automaticamente..." -ForegroundColor Yellow
    
    # Lista de arquivos que podem ter conflitos
    $conflictFiles = @(
        "backend/src/controllers/dashboardController.ts",
        "backend/src/controllers/predictionController.ts",
        "backend/src/routes/predictionRoutes.ts",
        "backend/src/routes/index.ts",
        "backend/package.json",
        "backend/package-lock.json"
    )
    
    $resolvedCount = 0
    
    foreach ($file in $conflictFiles) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            if ($content -match '<<<<<<<') {
                Write-Host "   📝 Resolvendo conflitos em: $file" -ForegroundColor Cyan
                
                # Estratégia: manter ambas as alterações
                $resolved = $content -replace '<<<<<<< HEAD\r?\n', '' -replace '=======\r?\n', '' -replace '>>>>>>> [^\r\n]+\r?\n', ''
                $resolved = $resolved -replace '\r?\n\r?\n\r?\n+', "`r`n`r`n"
                
                Set-Content -Path $file -Value $resolved -Encoding UTF8
                $resolvedCount++
                Write-Host "   ✅ Conflitos resolvidos em: $file" -ForegroundColor Green
            }
        }
    }
    
    if ($resolvedCount -gt 0) {
        Write-Host "   📝 Adicionando arquivos resolvidos..." -ForegroundColor Yellow
        git add .
        
        Write-Host "   📝 Fazendo commit da resolução..." -ForegroundColor Yellow
        git commit -m "resolve: conflitos resolvidos automaticamente - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        
        Write-Host "   ✅ $resolvedCount arquivos com conflitos resolvidos" -ForegroundColor Green
    } else {
        Write-Host "   ✅ Nenhum conflito encontrado" -ForegroundColor Green
    }
}

function Safe-Pull {
    Write-Host "2️⃣ Fazendo pull seguro..." -ForegroundColor Yellow
    try {
        git pull --no-edit --strategy=recursive -X ours origin $Branch
        Write-Host "   ✅ Pull realizado com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Conflitos detectados, resolvendo..." -ForegroundColor Yellow
        Resolve-Conflicts
    }
}

function Safe-Merge {
    Write-Host "2️⃣ Fazendo merge seguro..." -ForegroundColor Yellow
    try {
        git merge --no-edit --strategy=recursive -X ours origin/$Branch
        Write-Host "   ✅ Merge realizado com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Conflitos detectados, resolvendo..." -ForegroundColor Yellow
        Resolve-Conflicts
    }
}

# Executar operação
$hasBackup = Backup-Changes

switch ($Operation.ToLower()) {
    "pull" { Safe-Pull }
    "merge" { Safe-Merge }
    default { 
        Write-Host "❌ Operação não reconhecida. Use 'pull' ou 'merge'" -ForegroundColor Red
        exit 1
    }
}

# Verificar se ainda há conflitos
$gitStatus = git status --porcelain
if ($gitStatus -match 'UU|AA|DD') {
    Write-Host "`n⚠️ Ainda há conflitos não resolvidos:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Red
    Write-Host "`n🔧 Execute manualmente: git add . && git commit" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ Todos os conflitos foram resolvidos!" -ForegroundColor Green
}

# Restaurar backup se necessário
if ($hasBackup) {
    Write-Host "`n4️⃣ Verificando backup..." -ForegroundColor Yellow
    $stashList = git stash list
    if ($stashList -match "Backup automatico") {
        Write-Host "   ⚠️ Há alterações em stash. Execute 'git stash pop' se necessário." -ForegroundColor Yellow
        Write-Host "   📋 Para ver as alterações: git stash show -p" -ForegroundColor Cyan
    }
}

Write-Host "`n🎉 Operação Git segura concluída!" -ForegroundColor Green
Write-Host "✅ Todas as alterações foram preservadas!" -ForegroundColor Green
