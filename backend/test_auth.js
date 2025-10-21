// Teste simples para validar o sistema de autenticação JWT
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
  console.log('🧪 Testando sistema de autenticação JWT...\n');

  try {
    // 1. Teste de login com credenciais inválidas
    console.log('1. Testando login com credenciais inválidas...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        Email: 'test@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Login com credenciais inválidas rejeitado corretamente');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data);
      }
    }

    // 2. Teste de acesso a rota protegida sem token
    console.log('\n2. Testando acesso a rota protegida sem token...');
    try {
      await axios.get(`${BASE_URL}/users`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token rejeitado corretamente');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data);
      }
    }

    // 3. Teste de acesso a rota protegida com token inválido
    console.log('\n3. Testando acesso com token inválido...');
    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Token inválido rejeitado corretamente');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data);
      }
    }

    console.log('\n🎉 Testes de autenticação concluídos!');
    console.log('\nPara testar login com credenciais válidas:');
    console.log('1. Crie um usuário via POST /api/auth/register');
    console.log('2. Faça login via POST /api/auth/login');
    console.log('3. Use o token retornado no header Authorization: Bearer <token>');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Executar testes se o servidor estiver rodando
testAuth();
