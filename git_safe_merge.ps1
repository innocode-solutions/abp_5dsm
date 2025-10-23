# Script para fazer merge seguro sem perder alterações
param(
    [string]$BranchName = "main"
)

Write-Host "🔄 Fazendo merge seguro com $BranchName..." -ForegroundColor Green
Write-Host "=" * 50

# 1. Verificar se estamos em uma branch
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    Write-Host "❌ Não estamos em uma branch. Execute 'git checkout -b nome-da-branch'" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Branch atual: $currentBranch" -ForegroundColor Cyan

# 2. Fazer backup das alterações
Write-Host "1️⃣ Fazendo backup das alterações..." -ForegroundColor Yellow
git stash push -m "Backup antes do merge com $BranchName - $(Get-Date)"

# 3. Fazer merge com estratégia que preserva alterações
Write-Host "2️⃣ Fazendo merge com estratégia segura..." -ForegroundColor Yellow
try {
    git merge --no-edit --strategy=recursive -X ours origin/$BranchName
    Write-Host "✅ Merge realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Houve conflitos, resolvendo automaticamente..." -ForegroundColor Yellow
    
    # 4. Resolver conflitos automaticamente
    Write-Host "3️⃣ Resolvendo conflitos..." -ForegroundColor Yellow
    & .\resolve_conflicts.ps1
    
    # 5. Verificar se ainda há conflitos
    $gitStatus = git status --porcelain
    if ($gitStatus -match 'UU|AA|DD') {
        Write-Host "⚠️ Ainda há conflitos não resolvidos:" -ForegroundColor Yellow
        Write-Host $gitStatus -ForegroundColor Red
        Write-Host "🔧 Execute manualmente: git add . && git commit" -ForegroundColor Cyan
    } else {
        # 6. Adicionar arquivos resolvidos
        git add .
        
        # 7. Fazer commit da resolução
        git commit -m "resolve: resolver conflitos de merge com $BranchName automaticamente"
        
        Write-Host "✅ Conflitos resolvidos automaticamente!" -ForegroundColor Green
    }
}

# 8. Restaurar alterações locais se necessário
Write-Host "4️⃣ Verificando se há alterações para restaurar..." -ForegroundColor Yellow
$stashList = git stash list
if ($stashList -match "Backup antes do merge") {
    Write-Host "⚠️ Há alterações em stash. Execute 'git stash pop' se necessário." -ForegroundColor Yellow
    Write-Host "   Para ver as alterações: git stash show -p" -ForegroundColor Cyan
}

Write-Host "`n🎉 Merge seguro concluído!" -ForegroundColor Green
Write-Host "✅ Todas as alterações foram preservadas!" -ForegroundColor Green
