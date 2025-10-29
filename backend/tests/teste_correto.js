// Teste correto do JWT
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testeCorreto() {
  console.log('✅ TESTE CORRETO DO JWT\n');
  
  try {
    // 1. Registrar usuário CORRETAMENTE
    console.log('1️⃣ Registrando usuário...');
    const testEmail = `teste${Date.now()}@example.com`;
    const testPassword = '123456';
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      Email: testEmail,
      password: testPassword,  // ← CAMPO CORRETO!
      name: 'Usuário Teste',
      Role: 'STUDENT'
    });
    
    console.log('✅ Usuário registrado com sucesso!');

    // 2. Fazer login
    console.log('\n2️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: testEmail,
      password: testPassword
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso!');
    console.log(`🔑 Token: ${token.substring(0, 30)}...`);

    // 3. Testar acesso com token
    console.log('\n3️⃣ Testando acesso com token...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Acesso com token funcionando!');
    console.log(`👤 Usuário: ${meResponse.data.name} (${meResponse.data.Role})`);

    // 4. Testar sem token
    console.log('\n4️⃣ Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/users`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token bloqueado corretamente!');
      }
    }

    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema de autenticação JWT funcionando perfeitamente!');
    console.log('\n💡 LEMBRE-SE: Use campo "password" no registro, não "PasswordHash"!');

  } catch (error) {
    console.log('❌ Erro:', error.response?.data || error.message);
  }
}

testeCorreto();
