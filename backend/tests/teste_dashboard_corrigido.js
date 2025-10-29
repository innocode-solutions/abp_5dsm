const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const PROFESSOR_EMAIL = 'admin@dashboard.com';
const PROFESSOR_PASSWORD = '123456';

async function testarDashboardCorrigido() {
  try {
    console.log('🧪 TESTANDO DASHBOARD CORRIGIDO\n');
    console.log('=' .repeat(50));

    // 1. Health Check
    console.log('1️⃣ Verificando se API está rodando...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ API está rodando:', healthResponse.data.message);
    } catch (error) {
      console.log('❌ API não está rodando. Inicie o servidor com: npm start');
      return;
    }

    // 2. Login do Professor
    console.log('\n2️⃣ Fazendo login do professor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: PROFESSOR_EMAIL,
      password: PROFESSOR_PASSWORD
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.IDUser;
    
    console.log('✅ Login realizado com sucesso!');
    console.log(`   Email: ${PROFESSOR_EMAIL}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // 3. Testar Dashboard Completo (URL CORRETA)
    console.log('\n3️⃣ Testando dashboard completo...');
    console.log(`   URL: ${BASE_URL}/dashboard/professor/${userId}`);
    
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/professor/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard funcionando!');
      console.log('\n📊 DADOS DO DASHBOARD:');
      console.log(`   📈 Total de alunos: ${dashboardResponse.data.data.resumo.totalAlunos}`);
      console.log(`   📊 Média de notas: ${dashboardResponse.data.data.resumo.mediaNotas}`);
      console.log(`   ✅ % Aprovados: ${dashboardResponse.data.data.resumo.percentualAprovados}%`);
      console.log(`   ⚠️ % Risco alto: ${dashboardResponse.data.data.resumo.percentualRiscoAlto}%`);
      
      if (dashboardResponse.data.data.alunos.length > 0) {
        console.log('\n👥 ALUNOS:');
        dashboardResponse.data.data.alunos.forEach((aluno, index) => {
          console.log(`   ${index + 1}. ${aluno.Nome} - Nota: ${aluno.Nota} - Status: ${aluno.Status}`);
        });
      } else {
        console.log('\n⚠️ Nenhum aluno encontrado. Execute o cadastro primeiro.');
      }
      
    } catch (error) {
      console.log('❌ Erro no dashboard:', error.response?.data || error.message);
    }

    // 4. Testar Dashboard Resumo (URL CORRETA)
    console.log('\n4️⃣ Testando dashboard resumo...');
    console.log(`   URL: ${BASE_URL}/dashboard/professor/${userId}/resumo`);
    
    try {
      const resumoResponse = await axios.get(`${BASE_URL}/dashboard/professor/${userId}/resumo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard resumo funcionando!');
      console.log('\n📊 RESUMO:');
      console.log(`   📈 Total de alunos: ${resumoResponse.data.data.totalAlunos}`);
      console.log(`   📊 Média de notas: ${resumoResponse.data.data.mediaNotas}`);
      console.log(`   ✅ % Aprovados: ${resumoResponse.data.data.percentualAprovados}%`);
      console.log(`   ⚠️ % Risco alto: ${resumoResponse.data.data.percentualRiscoAlto}%`);
      
    } catch (error) {
      console.log('❌ Erro no dashboard resumo:', error.response?.data || error.message);
    }

    // 5. Comandos para teste manual
    console.log('\n🎯 COMANDOS PARA TESTE MANUAL:');
    console.log('=' .repeat(50));
    
    console.log('\n📋 DADOS IMPORTANTES:');
    console.log(`   👤 Professor: ${PROFESSOR_EMAIL}`);
    console.log(`   🆔 User ID: ${userId}`);
    console.log(`   🔑 Token: ${token.substring(0, 50)}...`);

    console.log('\n🧪 COMANDOS CURL:');
    console.log(`# Dashboard completo (URL CORRETA):`);
    console.log(`curl -X GET "${BASE_URL}/dashboard/professor/${userId}" \\`);
    console.log(`  -H "Authorization: Bearer ${token}"`);
    
    console.log(`\n# Dashboard resumo (URL CORRETA):`);
    console.log(`curl -X GET "${BASE_URL}/dashboard/professor/${userId}/resumo" \\`);
    console.log(`  -H "Authorization: Bearer ${token}"`);

    console.log('\n🧪 COMANDOS POWERSHELL:');
    console.log(`# Dashboard completo:`);
    console.log(`iwr "${BASE_URL}/dashboard/professor/${userId}" -Headers @{Authorization="Bearer ${token}"}`);
    
    console.log(`\n# Dashboard resumo:`);
    console.log(`iwr "${BASE_URL}/dashboard/professor/${userId}/resumo" -Headers @{Authorization="Bearer ${token}"}`);

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE O TESTE:');
    console.error('=' .repeat(50));
    console.error('Erro:', error.response?.data || error.message);
    
    if (error.response?.data?.error === 'Credenciais inválidas') {
      console.error('\n🔧 SOLUÇÃO:');
      console.error('1. Execute primeiro: node cadastro_completo_zero.js');
      console.error('2. Ou verifique se o email/senha estão corretos');
    }
  }
}

testarDashboardCorrigido();
