const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function limparBanco() {
  try {
    console.log('🧹 Limpando banco de dados...');
    
    // Fazer login como admin existente
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: 'admin@dashboard.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado');
    
    // Listar usuários
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📋 Encontrados ${usersResponse.data.length} usuários`);
    
    // Deletar usuários (exceto o admin atual)
    for (const user of usersResponse.data) {
      if (user.Email !== 'admin@dashboard.com') {
        try {
          await axios.delete(`${BASE_URL}/users/${user.IDUser}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`🗑️ Usuário deletado: ${user.Email}`);
        } catch (error) {
          console.log(`⚠️ Erro ao deletar ${user.Email}:`, error.response?.data?.error);
        }
      }
    }
    
    console.log('✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error.response?.data || error.message);
  }
}

limparBanco();
