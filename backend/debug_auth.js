// Script para debugar problemas de autenticação
const axios = require('axios');
const bcrypt = require('bcrypt');

const BASE_URL = 'http://localhost:3000/api';

async function debugAuth() {
  console.log('🔍 DEBUGANDO PROBLEMAS DE AUTENTICAÇÃO\n');
  
  try {
    // 1. Verificar se o servidor está rodando
    console.log('1️⃣ Verificando servidor...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Servidor está rodando');
    } catch (error) {
      console.log('❌ Servidor não está rodando ou não está acessível');
      console.log('💡 Execute: npm run dev');
      return;
    }

    // 2. Tentar registrar um novo usuário
    console.log('\n2️⃣ Tentando registrar novo usuário...');
    const testEmail = `teste${Date.now()}@example.com`;
    const testPassword = '123456';
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        Email: testEmail,
        PasswordHash: testPassword,
        name: 'Usuário Teste',
        Role: 'STUDENT'
      });
      console.log('✅ Usuário registrado com sucesso');
      console.log(`📧 Email: ${testEmail}`);
    } catch (error) {
      console.log('❌ Erro ao registrar usuário:', error.response?.data);
      return;
    }

    // 3. Tentar fazer login
    console.log('\n3️⃣ Tentando fazer login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        Email: testEmail,
        password: testPassword
      });
      console.log('✅ Login realizado com sucesso!');
      console.log('🔑 Token recebido:', loginResponse.data.token ? 'SIM' : 'NÃO');
      return;
    } catch (error) {
      console.log('❌ Erro no login:', error.response?.data);
      
      // 4. Verificar se o usuário foi criado no banco
      console.log('\n4️⃣ Verificando se usuário existe no banco...');
      try {
        // Tentar acessar endpoint que lista usuários (se for admin)
        const usersResponse = await axios.get(`${BASE_URL}/users`);
        console.log('✅ Conseguiu acessar lista de usuários');
      } catch (error) {
        console.log('⚠️ Não conseguiu acessar lista de usuários (normal se não for admin)');
      }
    }

    // 5. Testar com usuário existente
    console.log('\n5️⃣ Testando com usuário existente...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        Email: 'teste@example.com',
        password: '123456'
      });
      console.log('✅ Login com usuário existente funcionou!');
    } catch (error) {
      console.log('❌ Login com usuário existente falhou:', error.response?.data);
      
      // 6. Verificar hash da senha
      console.log('\n6️⃣ Verificando hash da senha...');
      const hashedPassword = await bcrypt.hash('123456', 12);
      console.log('🔐 Hash da senha "123456":', hashedPassword);
      console.log('💡 Verifique se a senha está sendo hasheada corretamente no registro');
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

debugAuth();
