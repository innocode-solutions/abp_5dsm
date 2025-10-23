# Script PowerShell para resolver conflitos de merge
Write-Host "🔧 Resolvendo conflitos de merge automaticamente..." -ForegroundColor Green
Write-Host "=" * 60

# Função para resolver conflitos em um arquivo
function Resolve-Conflicts {
    param(
        [string]$FilePath
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        
        if ($content -match '<<<<<<<') {
            Write-Host "📝 Resolvendo conflitos em: $FilePath" -ForegroundColor Yellow
            
            # Estratégia: manter ambas as alterações
            $resolvedContent = $content -replace '<<<<<<< HEAD\r?\n', ''
            $resolvedContent = $resolvedContent -replace '=======\r?\n', ''
            $resolvedContent = $resolvedContent -replace '>>>>>>> [^\r\n]+\r?\n', ''
            $resolvedContent = $resolvedContent -replace '\r?\n\r?\n\r?\n+', "`r`n`r`n"
            
            Set-Content -Path $FilePath -Value $resolvedContent -Encoding UTF8
            Write-Host "✅ Conflitos resolvidos em: $FilePath" -ForegroundColor Green
            return $true
        }
    }
    return $false
}

# Lista de arquivos que podem ter conflitos
$possibleConflictFiles = @(
    "backend/src/controllers/dashboardController.ts",
    "backend/src/controllers/predictionController.ts", 
    "backend/src/routes/predictionRoutes.ts",
    "backend/src/routes/index.ts",
    "backend/package.json",
    "backend/package-lock.json",
    "backend/src/controllers/dashboardIESController.ts",
    "backend/src/routes/dashboardIESRoutes.ts"
)

$conflictsResolved = 0

foreach ($file in $possibleConflictFiles) {
    if (Resolve-Conflicts -FilePath $file) {
        $conflictsResolved++
    }
}

Write-Host "`n🎉 Conflitos resolvidos: $conflictsResolved arquivos" -ForegroundColor Green
Write-Host "✅ Todas as alterações foram mantidas!" -ForegroundColor Green

# Verificar se ainda há conflitos
$gitStatus = git status --porcelain
if ($gitStatus -match 'UU|AA|DD') {
    Write-Host "`n⚠️ Ainda há conflitos não resolvidos:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Red
} else {
    Write-Host "`n✅ Todos os conflitos foram resolvidos!" -ForegroundColor Green
}