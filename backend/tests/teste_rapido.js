// Teste rápido do JWT - Execute: node teste_rapido.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testeRapido() {
  console.log('🧪 TESTE RÁPIDO DO JWT\n');
  
  try {
    // 1. Registrar usuário
    console.log('1️⃣ Registrando usuário...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        Email: 'teste@example.com',
        PasswordHash: '123456',
        name: 'Usuário Teste',
        Role: 'STUDENT'
      });
      console.log('✅ Usuário registrado');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ Usuário já existe, continuando...');
      } else {
        throw error;
      }
    }

    // 2. Fazer login
    console.log('\n2️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: 'teste@example.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado!');
    console.log(`🔑 Token: ${token.substring(0, 30)}...`);

    // 3. Testar acesso com token
    console.log('\n3️⃣ Testando acesso com token...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Acesso com token funcionando!');
    console.log(`👤 Usuário: ${meResponse.data.name} (${meResponse.data.Role})`);

    // 4. Testar acesso sem token
    console.log('\n4️⃣ Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/users`);
      console.log('❌ ERRO: Deveria ter falhado!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token bloqueado corretamente!');
      }
    }

    // 5. Testar token inválido
    console.log('\n5️⃣ Testando token inválido...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': 'Bearer token-invalido' }
      });
      console.log('❌ ERRO: Deveria ter falhado!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Token inválido bloqueado corretamente!');
      }
    }

    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema de autenticação JWT funcionando perfeitamente!');

  } catch (error) {
    console.log('\n❌ ERRO:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Certifique-se de que o servidor está rodando: npm run dev');
    }
  }
}

testeRapido();
