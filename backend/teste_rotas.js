const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testarRotas() {
  try {
    console.log('🧪 Testando rotas do servidor...\n');

    // 1. Testar rota de health
    console.log('1️⃣ Testando rota de health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Health check funcionando:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check falhou:', error.response?.data || error.message);
    }

    // 2. Testar login
    console.log('\n2️⃣ Testando login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        Email: 'admin@test.com',
        password: '123456'
      });
      console.log('✅ Login funcionando!');
      console.log(`   Token: ${loginResponse.data.token.substring(0, 50)}...`);
      console.log(`   User ID: ${loginResponse.data.user.IDUser}`);
      
      const token = loginResponse.data.token;
      
      // 3. Testar rota de usuários
      console.log('\n3️⃣ Testando rota de usuários...');
      try {
        const usersResponse = await axios.get(`${BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Rota de usuários funcionando!');
        console.log(`   Usuários encontrados: ${usersResponse.data.length}`);
      } catch (error) {
        console.log('❌ Rota de usuários falhou:', error.response?.data || error.message);
      }

      // 4. Testar rota de cursos
      console.log('\n4️⃣ Testando rota de cursos...');
      try {
        const cursosResponse = await axios.get(`${BASE_URL}/cursos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Rota de cursos funcionando!');
        console.log(`   Cursos encontrados: ${cursosResponse.data.length}`);
      } catch (error) {
        console.log('❌ Rota de cursos falhou:', error.response?.data || error.message);
      }

      // 5. Testar rota de disciplinas
      console.log('\n5️⃣ Testando rota de disciplinas...');
      try {
        const disciplinasResponse = await axios.get(`${BASE_URL}/disciplinas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Rota de disciplinas funcionando!');
        console.log(`   Disciplinas encontradas: ${disciplinasResponse.data.length}`);
      } catch (error) {
        console.log('❌ Rota de disciplinas falhou:', error.response?.data || error.message);
      }

      // 6. Testar rota de períodos
      console.log('\n6️⃣ Testando rota de períodos...');
      try {
        const periodosResponse = await axios.get(`${BASE_URL}/periodos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Rota de períodos funcionando!');
        console.log(`   Períodos encontrados: ${periodosResponse.data.length}`);
      } catch (error) {
        console.log('❌ Rota de períodos falhou:', error.response?.data || error.message);
      }

      // 7. Testar rota de alunos
      console.log('\n7️⃣ Testando rota de alunos...');
      try {
        const alunosResponse = await axios.get(`${BASE_URL}/alunos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Rota de alunos funcionando!');
        console.log(`   Alunos encontrados: ${alunosResponse.data.length}`);
      } catch (error) {
        console.log('❌ Rota de alunos falhou:', error.response?.data || error.message);
      }

      // 8. Testar rota de matrículas
      console.log('\n8️⃣ Testando rota de matrículas...');
      try {
        const matriculasResponse = await axios.get(`${BASE_URL}/matriculas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Rota de matrículas funcionando!');
        console.log(`   Matrículas encontradas: ${matriculasResponse.data.length}`);
      } catch (error) {
        console.log('❌ Rota de matrículas falhou:', error.response?.data || error.message);
      }

      // 9. Testar rota de predições
      console.log('\n9️⃣ Testando rota de predições...');
      try {
        const predictionsResponse = await axios.get(`${BASE_URL}/predictions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Rota de predições funcionando!');
        console.log(`   Predições encontradas: ${predictionsResponse.data.length}`);
      } catch (error) {
        console.log('❌ Rota de predições falhou:', error.response?.data || error.message);
      }

      // 10. Testar rota do dashboard
      console.log('\n🔟 Testando rota do dashboard...');
      try {
        const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/professor/${loginResponse.data.user.IDUser}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Rota do dashboard funcionando!');
        console.log(`   Dados do dashboard:`, dashboardResponse.data);
      } catch (error) {
        console.log('❌ Rota do dashboard falhou:', error.response?.data || error.message);
      }

    } catch (error) {
      console.log('❌ Login falhou:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testarRotas();


