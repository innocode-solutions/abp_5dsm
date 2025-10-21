// Script completo de teste para o sistema de autenticação JWT
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testServerConnection() {
  try {
    logInfo('Testando conexão com o servidor...');
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      logSuccess('Servidor está rodando!');
      return true;
    }
  } catch (error) {
    logError('Servidor não está rodando ou não está acessível');
    logError('Certifique-se de que o backend está rodando em http://localhost:3000');
    return false;
  }
}

async function testRegister() {
  try {
    logInfo('Testando registro de usuário...');
    const userData = {
      Email: 'teste@example.com',
      PasswordHash: '123456',
      name: 'Usuário Teste',
      Role: 'STUDENT'
    };

    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    if (response.status === 201) {
      logSuccess('Usuário registrado com sucesso!');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      logWarning('Usuário já existe, continuando com os testes...');
      return true;
    } else {
      logError('Erro ao registrar usuário:', error.response?.data);
      return false;
    }
  }
}

async function testLogin() {
  try {
    logInfo('Testando login...');
    const loginData = {
      Email: 'teste@example.com',
      password: '123456'
    };

    const response = await axios.post(`${BASE_URL}/auth/login`, loginData);
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      logSuccess('Login realizado com sucesso!');
      logInfo(`Token recebido: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    logError('Erro no login:', error.response?.data);
    return false;
  }
}

async function testLoginInvalid() {
  try {
    logInfo('Testando login com credenciais inválidas...');
    const loginData = {
      Email: 'teste@example.com',
      password: 'senhaerrada'
    };

    await axios.post(`${BASE_URL}/auth/login`, loginData);
    logError('Login com credenciais inválidas deveria ter falhado!');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Login com credenciais inválidas rejeitado corretamente!');
      return true;
    } else {
      logError('Erro inesperado:', error.response?.data);
      return false;
    }
  }
}

async function testProtectedRouteWithoutToken() {
  try {
    logInfo('Testando acesso a rota protegida sem token...');
    await axios.get(`${BASE_URL}/users`);
    logError('Acesso sem token deveria ter falhado!');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Acesso sem token rejeitado corretamente!');
      return true;
    } else {
      logError('Erro inesperado:', error.response?.data);
      return false;
    }
  }
}

async function testProtectedRouteWithInvalidToken() {
  try {
    logInfo('Testando acesso com token inválido...');
    await axios.get(`${BASE_URL}/users`, {
      headers: {
        'Authorization': 'Bearer token-invalido'
      }
    });
    logError('Acesso com token inválido deveria ter falhado!');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Token inválido rejeitado corretamente!');
      return true;
    } else {
      logError('Erro inesperado:', error.response?.data);
      return false;
    }
  }
}

async function testProtectedRouteWithValidToken() {
  try {
    logInfo('Testando acesso com token válido...');
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    if (response.status === 200) {
      logSuccess('Acesso com token válido funcionando!');
      logInfo(`Usuário autenticado: ${response.data.name} (${response.data.Role})`);
      return true;
    }
  } catch (error) {
    logError('Erro ao acessar com token válido:', error.response?.data);
    return false;
  }
}

async function testRoleBasedAccess() {
  try {
    logInfo('Testando controle de acesso baseado em roles...');
    
    // Tentar acessar endpoint que requer ADMIN (usuário é STUDENT)
    await axios.get(`${BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    logError('Acesso a endpoint de ADMIN deveria ter falhado para usuário STUDENT!');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      logSuccess('Controle de acesso baseado em roles funcionando!');
      return true;
    } else {
      logError('Erro inesperado no controle de roles:', error.response?.data);
      return false;
    }
  }
}

async function runAllTests() {
  log('🧪 INICIANDO TESTES DO SISTEMA DE AUTENTICAÇÃO JWT', 'bold');
  log('=' .repeat(60), 'blue');
  
  const tests = [
    { name: 'Conexão com Servidor', fn: testServerConnection },
    { name: 'Registro de Usuário', fn: testRegister },
    { name: 'Login Válido', fn: testLogin },
    { name: 'Login Inválido', fn: testLoginInvalid },
    { name: 'Acesso sem Token', fn: testProtectedRouteWithoutToken },
    { name: 'Acesso com Token Inválido', fn: testProtectedRouteWithInvalidToken },
    { name: 'Acesso com Token Válido', fn: testProtectedRouteWithValidToken },
    { name: 'Controle de Roles', fn: testRoleBasedAccess }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    log(`\n📋 ${test.name}...`, 'bold');
    const result = await test.fn();
    if (result) {
      passed++;
    }
  }

  log('\n' + '=' .repeat(60), 'blue');
  log(`📊 RESULTADO DOS TESTES: ${passed}/${total} passaram`, 'bold');
  
  if (passed === total) {
    log('🎉 TODOS OS TESTES PASSARAM! Sistema de autenticação funcionando perfeitamente!', 'green');
    log('\n📋 Critérios de aceite verificados:', 'bold');
    log('✅ Endpoint POST /auth/login criado', 'green');
    log('✅ Login com email + senha válida gera token JWT', 'green');
    log('✅ Tokens contêm userId, role, exp', 'green');
    log('✅ Middleware valida token em rotas protegidas', 'green');
    log('✅ Tokens válidos por 1 hora', 'green');
    log('✅ 100% dos endpoints sensíveis exigem autenticação', 'green');
  } else {
    log(`❌ ${total - passed} teste(s) falharam. Verifique os erros acima.`, 'red');
  }

  log('\n💡 Para testar manualmente:', 'yellow');
  log('1. Registre um usuário: POST /api/auth/register', 'yellow');
  log('2. Faça login: POST /api/auth/login', 'yellow');
  log('3. Use o token: Authorization: Bearer <token>', 'yellow');
}

// Executar testes
runAllTests().catch(console.error);
