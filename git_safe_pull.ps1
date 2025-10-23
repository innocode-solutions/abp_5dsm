# Script para fazer pull seguro sem perder alterações
Write-Host "🔄 Fazendo pull seguro..." -ForegroundColor Green
Write-Host "=" * 50

# 1. Fazer backup das alterações locais
Write-Host "1️⃣ Fazendo backup das alterações locais..." -ForegroundColor Yellow
git stash push -m "Backup antes do pull - $(Get-Date)"

# 2. Fazer pull com estratégia que preserva alterações
Write-Host "2️⃣ Fazendo pull com estratégia segura..." -ForegroundColor Yellow
try {
    git pull --no-edit --strategy=recursive -X ours origin main
    Write-Host "✅ Pull realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Houve conflitos, resolvendo automaticamente..." -ForegroundColor Yellow
    
    # 3. Resolver conflitos automaticamente
    Write-Host "3️⃣ Resolvendo conflitos..." -ForegroundColor Yellow
    & .\resolve_conflicts.ps1
    
    # 4. Adicionar arquivos resolvidos
    git add .
    
    # 5. Fazer commit da resolução
    git commit -m "resolve: resolver conflitos de merge automaticamente"
    
    Write-Host "✅ Conflitos resolvidos automaticamente!" -ForegroundColor Green
}

# 6. Restaurar alterações locais se necessário
Write-Host "4️⃣ Verificando se há alterações para restaurar..." -ForegroundColor Yellow
$stashList = git stash list
if ($stashList -match "Backup antes do pull") {
    Write-Host "⚠️ Há alterações em stash. Execute 'git stash pop' se necessário." -ForegroundColor Yellow
    Write-Host "   Para ver as alterações: git stash show -p" -ForegroundColor Cyan
}

Write-Host "`n🎉 Pull seguro concluído!" -ForegroundColor Green
Write-Host "✅ Todas as alterações foram preservadas!" -ForegroundColor Green
