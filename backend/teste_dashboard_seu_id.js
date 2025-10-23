const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const PROFESSOR_ID = 'd0ebd767-8f58cee0d4cf7248-465e-9ec1-'; // Seu ID do professor

async function testarDashboard() {
  try {
    console.log('🚀 Testando dashboard com seu ID de professor...\n');
    console.log(`📋 ID do Professor: ${PROFESSOR_ID}\n`);

    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: 'admin@test.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado!');
    console.log(`🔑 Token obtido: ${token.substring(0, 50)}...\n`);

    // 2. Testar dashboard completo
    console.log('2️⃣ Testando dashboard completo...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/professor/${PROFESSOR_ID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard funcionando!');
      console.log('📊 Dados do dashboard:');
      console.log(JSON.stringify(dashboardResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Erro no dashboard completo:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Erro: ${error.response?.data?.error || error.message}`);
    }

    // 3. Testar dashboard resumo
    console.log('\n3️⃣ Testando dashboard resumo...');
    try {
      const resumoResponse = await axios.get(`${BASE_URL}/dashboard/professor/${PROFESSOR_ID}/resumo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard resumo funcionando!');
      console.log('📊 Resumo dos dados:');
      console.log(JSON.stringify(resumoResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Erro no dashboard resumo:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Erro: ${error.response?.data?.error || error.message}`);
    }

    // 4. Mostrar comandos cURL para teste manual
    console.log('\n🎯 Comandos cURL para teste manual:');
    console.log(`# Dashboard completo:`);
    console.log(`curl -X GET "${BASE_URL}/dashboard/professor/${PROFESSOR_ID}" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json"`);
    
    console.log(`\n# Dashboard resumo:`);
    console.log(`curl -X GET "${BASE_URL}/dashboard/professor/${PROFESSOR_ID}/resumo" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -H "Content-Type: application/json"`);

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testarDashboard();

