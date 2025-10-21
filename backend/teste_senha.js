// Teste específico para verificar problema de senha
const axios = require('axios');
const bcrypt = require('bcrypt');

const BASE_URL = 'http://localhost:3000/api';

async function testeSenha() {
  console.log('🔐 TESTANDO PROBLEMA DE SENHA\n');
  
  try {
    // 1. Registrar usuário com senha simples
    const testEmail = `teste${Date.now()}@example.com`;
    const testPassword = '123456';
    
    console.log('1️⃣ Registrando usuário...');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Senha: ${testPassword}`);
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      Email: testEmail,
      PasswordHash: testPassword,  // ← AQUI ESTÁ O PROBLEMA!
      name: 'Usuário Teste',
      Role: 'STUDENT'
    });
    
    console.log('✅ Usuário registrado');

    // 2. Verificar o que foi salvo no banco
    console.log('\n2️⃣ Verificando hash no banco...');
    
    // 3. Tentar fazer login
    console.log('\n3️⃣ Tentando fazer login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        Email: testEmail,
        password: testPassword
      });
      console.log('✅ Login funcionou!');
    } catch (error) {
      console.log('❌ Login falhou:', error.response?.data);
      
      // 4. Testar com senha hasheada manualmente
      console.log('\n4️⃣ Testando com senha hasheada manualmente...');
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      console.log(`🔐 Hash manual: ${hashedPassword}`);
      
      // 5. Verificar se o problema é no campo enviado
      console.log('\n5️⃣ Testando registro correto...');
      const testEmail2 = `teste2${Date.now()}@example.com`;
      
      try {
        // Registrar com campo 'password' em vez de 'PasswordHash'
        const registerResponse2 = await axios.post(`${BASE_URL}/auth/register`, {
          Email: testEmail2,
          password: testPassword,  // ← CAMPO CORRETO!
          name: 'Usuário Teste 2',
          Role: 'STUDENT'
        });
        
        console.log('✅ Usuário 2 registrado com campo correto');
        
        // Tentar login
        const loginResponse2 = await axios.post(`${BASE_URL}/auth/login`, {
          Email: testEmail2,
          password: testPassword
        });
        
        console.log('✅ Login do usuário 2 funcionou!');
        console.log('🎉 PROBLEMA IDENTIFICADO: Use campo "password" no registro!');
        
      } catch (error) {
        console.log('❌ Ainda não funcionou:', error.response?.data);
      }
    }

  } catch (error) {
    console.log('❌ Erro:', error.response?.data || error.message);
  }
}

testeSenha();
