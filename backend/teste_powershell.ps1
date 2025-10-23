# Script PowerShell para testar o Dashboard
Write-Host "🧪 TESTANDO DASHBOARD DO PROFESSOR" -ForegroundColor Green
Write-Host "=" * 50

# 1. Health Check
Write-Host "`n1️⃣ Verificando se API está rodando..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET
    $healthData = $healthResponse.Content | ConvertFrom-Json
    Write-Host "✅ API está rodando: $($healthData.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ API não está rodando. Inicie o servidor com: npm start" -ForegroundColor Red
    exit
}

# 2. Login
Write-Host "`n2️⃣ Fazendo login do professor..." -ForegroundColor Yellow
$loginBody = @{
    Email = "admin@dashboard.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    $token = $loginData.token
    $userId = $loginData.user.IDUser
    
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "   Email: admin@dashboard.com"
    Write-Host "   User ID: $userId"
    Write-Host "   Token: $($token.Substring(0, 50))..."
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Dashboard
Write-Host "`n3️⃣ Testando dashboard..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $dashboardResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/professor/$userId" -Method GET -Headers $headers
    $dashboardData = $dashboardResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Dashboard funcionando!" -ForegroundColor Green
    Write-Host "`n📊 DADOS DO DASHBOARD:"
    Write-Host "   📈 Total de alunos: $($dashboardData.data.resumo.totalAlunos)"
    Write-Host "   📊 Média de notas: $($dashboardData.data.resumo.mediaNotas)"
    Write-Host "   ✅ % Aprovados: $($dashboardData.data.resumo.percentualAprovados)%"
    Write-Host "   ⚠️ % Risco alto: $($dashboardData.data.resumo.percentualRiscoAlto)%"
    
    if ($dashboardData.data.alunos.Count -gt 0) {
        Write-Host "`n👥 ALUNOS:"
        for ($i = 0; $i -lt $dashboardData.data.alunos.Count; $i++) {
            $aluno = $dashboardData.data.alunos[$i]
            Write-Host "   $($i + 1). $($aluno.Nome) - Nota: $($aluno.Nota) - Status: $($aluno.Status)"
        }
    } else {
        Write-Host "`n⚠️ Nenhum aluno encontrado. Execute o cadastro primeiro." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erro no dashboard: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Dashboard Resumo
Write-Host "`n4️⃣ Testando dashboard resumo..." -ForegroundColor Yellow
try {
    $resumoResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/professor/$userId/resumo" -Method GET -Headers $headers
    $resumoData = $resumoResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Dashboard resumo funcionando!" -ForegroundColor Green
    Write-Host "`n📊 RESUMO:"
    Write-Host "   📈 Total de alunos: $($resumoData.data.totalAlunos)"
    Write-Host "   📊 Média de notas: $($resumoData.data.mediaNotas)"
    Write-Host "   ✅ % Aprovados: $($resumoData.data.percentualAprovados)%"
    Write-Host "   ⚠️ % Risco alto: $($resumoData.data.percentualRiscoAlto)%"
    
} catch {
    Write-Host "❌ Erro no dashboard resumo: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 COMANDOS PARA TESTE MANUAL:" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host "`n📋 DADOS IMPORTANTES:"
Write-Host "   👤 Professor: admin@dashboard.com"
Write-Host "   🆔 User ID: $userId"
Write-Host "   🔑 Token: $($token.Substring(0, 50))..."

Write-Host "`n🧪 COMANDOS POWERSHELL:"
Write-Host "# Health Check:"
Write-Host "iwr 'http://localhost:3000/api/health'"

Write-Host "`n# Login:"
Write-Host "`$body = @{Email='admin@dashboard.com'; password='123456'} | ConvertTo-Json"
Write-Host "iwr 'http://localhost:3000/api/auth/login' -Method POST -Body `$body -ContentType 'application/json'"

Write-Host "`n# Dashboard:"
Write-Host "`$headers = @{Authorization='Bearer $token'}"
Write-Host "iwr 'http://localhost:3000/api/dashboard/professor/$userId' -Headers `$headers"

Write-Host "`n🎉 TESTE CONCLUÍDO!" -ForegroundColor Green

