// Teste do dashboard do professor
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testeDashboard() {
  console.log('📊 TESTANDO DASHBOARD DO PROFESSOR\n');
  
  try {
    // 1. Fazer login como professor
    console.log('1️⃣ Fazendo login como professor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: 'professor@test.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado!');
    console.log(`👤 Usuário: ${loginResponse.data.user.name} (${loginResponse.data.user.Role})`);

    // 2. Testar dashboard completo
    console.log('\n2️⃣ Testando dashboard completo...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/professor/${loginResponse.data.user.IDUser}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard completo funcionando!');
      console.log(`📊 Métricas:`);
      console.log(`   - Média de notas: ${dashboardResponse.data.metricas.mediaNotas}`);
      console.log(`   - % Aprovados: ${dashboardResponse.data.metricas.percentualAprovados}%`);
      console.log(`   - % Risco alto evasão: ${dashboardResponse.data.metricas.percentualRiscoAltoEvasao}%`);
      console.log(`   - Total de alunos: ${dashboardResponse.data.totalAlunos}`);
      
    } catch (error) {
      console.log('❌ Erro no dashboard completo:', error.response?.data);
    }

    // 3. Testar dashboard com filtro por disciplina
    console.log('\n3️⃣ Testando dashboard com filtro por disciplina...');
    try {
      const dashboardFiltradoResponse = await axios.get(`${BASE_URL}/dashboard/professor/${loginResponse.data.user.IDUser}?disciplinaId=test-disciplina-id`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard com filtro funcionando!');
      console.log(`📊 Alunos filtrados: ${dashboardFiltradoResponse.data.totalAlunos}`);
      
    } catch (error) {
      console.log('⚠️ Dashboard com filtro:', error.response?.data);
    }

    // 4. Testar resumo rápido
    console.log('\n4️⃣ Testando resumo rápido...');
    try {
      const resumoResponse = await axios.get(`${BASE_URL}/dashboard/professor/${loginResponse.data.user.IDUser}/resumo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Resumo rápido funcionando!');
      console.log(`📊 Métricas resumidas:`);
      console.log(`   - Média: ${resumoResponse.data.metricas.mediaNotas}`);
      console.log(`   - Aprovados: ${resumoResponse.data.metricas.percentualAprovados}%`);
      console.log(`   - Risco evasão: ${resumoResponse.data.metricas.percentualRiscoAltoEvasao}%`);
      
    } catch (error) {
      console.log('❌ Erro no resumo:', error.response?.data);
    }

    // 5. Testar acesso sem token
    console.log('\n5️⃣ Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/dashboard/professor/${loginResponse.data.user.IDUser}`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token bloqueado corretamente!');
      }
    }

    // 6. Testar acesso com usuário não-professor
    console.log('\n6️⃣ Testando acesso com usuário não-professor...');
    try {
      // Fazer login como estudante
      const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
        Email: 'estudante@test.com',
        password: '123456'
      });
      
      const studentToken = studentLogin.data.token;
      
      // Tentar acessar dashboard
      await axios.get(`${BASE_URL}/dashboard/professor/${loginResponse.data.user.IDUser}`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      
      console.log('❌ Estudante conseguiu acessar dashboard (deveria falhar)!');
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Acesso de estudante bloqueado corretamente!');
      } else {
        console.log('⚠️ Erro inesperado:', error.response?.data);
      }
    }

    console.log('\n🎉 TESTES DO DASHBOARD CONCLUÍDOS!');

  } catch (error) {
    console.log('❌ Erro geral:', error.response?.data || error.message);
    console.log('\n💡 Dicas:');
    console.log('1. Certifique-se de que o servidor está rodando');
    console.log('2. Crie usuários de teste (professor e estudante)');
    console.log('3. Adicione dados de matrículas e predições no banco');
  }
}

testeDashboard();
