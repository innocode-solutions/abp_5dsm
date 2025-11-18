/**
 * Script de Teste - Predição de Evasão
 * 
 * Como usar:
 * 1. Certifique-se de que o backend está rodando (npm run dev)
 * 2. Certifique-se de que o serviço FastAPI está rodando (porta 5000)
 * 3. Execute: node test-predicao-evasao.js
 * 
 * IMPORTANTE: Edite as variáveis no início do arquivo com seus dados reais!
 */

const axios = require('axios');

// ============================================================================
// CONFIGURAÇÕES - EDITE AQUI COM SEUS DADOS REAIS
// ============================================================================
const BASE_URL = 'http://localhost:8080/api';
const ML_BASE_URL = 'http://localhost:5000';

// Credenciais de login
const LOGIN_EMAIL = 'aluno2@teste.com';  // ⚠️ ALTERE AQUI
const LOGIN_PASSWORD = 'aluno1234';        // ⚠️ ALTERE AQUI

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

let authToken = null;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function printSuccess(message, data = null) {
  console.log('✅', message);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function printError(message, error = null) {
  console.log('❌', message);
  if (error) {
    if (error.response) {
      // Erro com resposta do servidor
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
      if (error.response.status === 401) {
        console.log('\n💡 Dica: Verifique se o email e senha estão corretos.');
      }
    } else if (error.request) {
      // Erro de conexão (sem resposta)
      console.log('Erro de conexão:', error.message);
      console.log('Código:', error.code || 'N/A');
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 Dica: O backend não está rodando ou a URL está incorreta.');
        console.log('   Verifique se o backend está rodando em http://localhost:8080');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('\n💡 Dica: Timeout na conexão. O servidor pode estar lento ou indisponível.');
      }
    } else {
      // Outro tipo de erro
      console.log('Erro:', error.message);
      console.log('Stack:', error.stack);
    }
  }
}

// ============================================================================
// TESTE 1: LOGIN
// ============================================================================
async function testLogin() {
  printSection('TESTE 1: Login');
  
  console.log(`📧 Tentando fazer login com: ${LOGIN_EMAIL}`);
  console.log(`🌐 URL: ${BASE_URL}/auth/login\n`);
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      Email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    }, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    authToken = response.data.token;
    printSuccess('Login realizado com sucesso!', {
      user: response.data.user,
      token: authToken.substring(0, 50) + '...'
    });
    
    return true;
  } catch (error) {
    printError('Erro ao fazer login', error);
    
    // Dicas adicionais
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Solução:');
      console.log('   1. Verifique se o backend está rodando: npm run dev');
      console.log('   2. Verifique se a porta 8080 está correta');
      console.log('   3. Verifique se não há firewall bloqueando a conexão\n');
    } else if (error.response && error.response.status === 401) {
      console.log('\n🔧 Solução:');
      console.log('   1. Verifique se o email está correto:', LOGIN_EMAIL);
      console.log('   2. Verifique se a senha está correta');
      console.log('   3. Certifique-se de que o usuário existe no banco de dados\n');
    }
    
    return false;
  }
}

// ============================================================================
// TESTE 2: OBTER DADOS DO USUÁRIO
// ============================================================================
async function testGetUserData() {
  printSection('TESTE 2: Obter Dados do Usuário');
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    printSuccess('Dados do usuário obtidos com sucesso!', response.data);
    
    // Verifica se tem alunos
    if (!response.data.alunos || response.data.alunos.length === 0) {
      printError('Usuário não possui alunos associados!');
      return null;
    }
    
    const aluno = response.data.alunos[0];
    printSuccess(`Aluno encontrado: ${aluno.Nome} (ID: ${aluno.IDAluno})`);
    
    return aluno;
  } catch (error) {
    printError('Erro ao obter dados do usuário', error);
    return null;
  }
}

// ============================================================================
// TESTE 3: BUSCAR MATRÍCULAS
// ============================================================================
async function testGetMatriculas(alunoId) {
  printSection('TESTE 3: Buscar Matrículas do Aluno');
  
  try {
    const response = await axios.get(`${BASE_URL}/matriculas/aluno/${alunoId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    printSuccess(`Matrículas encontradas: ${response.data.length}`, response.data);
    
    if (response.data.length === 0) {
      printError('Nenhuma matrícula encontrada para este aluno!');
      return null;
    }
    
    return response.data[0]; // Retorna a primeira matrícula
  } catch (error) {
    printError('Erro ao buscar matrículas', error);
    return null;
  }
}

// ============================================================================
// TESTE 4: VERIFICAR SERVIÇO DE ML
// ============================================================================
async function testMLServiceHealth() {
  printSection('TESTE 4: Verificar Serviço de ML');
  
  try {
    const response = await axios.get(`${ML_BASE_URL}/`, {
      timeout: 5000
    });
    
    printSuccess('Serviço de ML está disponível!', response.data);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      printError('Serviço de ML não está disponível! Certifique-se de que está rodando na porta 5000.');
    } else {
      printError('Erro ao verificar serviço de ML', error);
    }
    return false;
  }
}

// ============================================================================
// TESTE 5: GERAR PREDIÇÃO - BAIXO RISCO
// ============================================================================
async function testPredictionLowRisk(matriculaId) {
  printSection('TESTE 5: Predição - Aluno com Baixo Risco');
  
  const engagementData = {
    raisedhands: 30,
    VisITedResources: 50,
    AnnouncementsView: 25,
    Discussion: 20,
    ParentAnsweringSurvey: 'Yes',
    ParentschoolSatisfaction: 'Good',
    StudentAbsenceDays: 'Under-7'
  };
  
  try {
    const response = await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: matriculaId,
        TipoPredicao: 'EVASAO',
        dados: engagementData
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    printSuccess('Predição gerada com sucesso!', response.data);
    
    if (response.data.data) {
      const prob = (response.data.data.Probabilidade * 100).toFixed(1);
      console.log(`\n📊 Resultado:`);
      console.log(`   Probabilidade de Evasão: ${prob}%`);
      console.log(`   Classificação: ${response.data.data.Classificacao}`);
      console.log(`   Explicação: ${response.data.data.Explicacao}`);
    }
    
    return response.data;
  } catch (error) {
    printError('Erro ao gerar predição', error);
    return null;
  }
}

// ============================================================================
// TESTE 6: GERAR PREDIÇÃO - MÉDIO RISCO
// ============================================================================
async function testPredictionMediumRisk(matriculaId) {
  printSection('TESTE 6: Predição - Aluno com Médio Risco');
  
  const engagementData = {
    raisedhands: 10,
    VisITedResources: 15,
    AnnouncementsView: 8,
    Discussion: 5,
    ParentAnsweringSurvey: 'Yes',
    ParentschoolSatisfaction: 'Good',
    StudentAbsenceDays: 'Under-7'
  };
  
  try {
    const response = await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: matriculaId,
        TipoPredicao: 'EVASAO',
        dados: engagementData
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    printSuccess('Predição gerada com sucesso!', response.data);
    
    if (response.data.data) {
      const prob = (response.data.data.Probabilidade * 100).toFixed(1);
      console.log(`\n📊 Resultado:`);
      console.log(`   Probabilidade de Evasão: ${prob}%`);
      console.log(`   Classificação: ${response.data.data.Classificacao}`);
    }
    
    return response.data;
  } catch (error) {
    printError('Erro ao gerar predição', error);
    return null;
  }
}

// ============================================================================
// TESTE 7: GERAR PREDIÇÃO - ALTO RISCO
// ============================================================================
async function testPredictionHighRisk(matriculaId) {
  printSection('TESTE 7: Predição - Aluno com Alto Risco');
  
  const engagementData = {
    raisedhands: 2,
    VisITedResources: 5,
    AnnouncementsView: 1,
    Discussion: 0,
    ParentAnsweringSurvey: 'No',
    ParentschoolSatisfaction: 'Bad',
    StudentAbsenceDays: 'Above-7'
  };
  
  try {
    const response = await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: matriculaId,
        TipoPredicao: 'EVASAO',
        dados: engagementData
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    printSuccess('Predição gerada com sucesso!', response.data);
    
    if (response.data.data) {
      const prob = (response.data.data.Probabilidade * 100).toFixed(1);
      console.log(`\n📊 Resultado:`);
      console.log(`   Probabilidade de Evasão: ${prob}%`);
      console.log(`   Classificação: ${response.data.data.Classificacao}`);
    }
    
    return response.data;
  } catch (error) {
    printError('Erro ao gerar predição', error);
    return null;
  }
}

// ============================================================================
// TESTE 8: BUSCAR PREDIÇÕES SALVAS
// ============================================================================
async function testGetPredictions(matriculaId) {
  printSection('TESTE 8: Buscar Predições Salvas');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/predictions/matricula/${matriculaId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    printSuccess(`Predições encontradas: ${response.data.length}`, response.data);
    return response.data;
  } catch (error) {
    printError('Erro ao buscar predições', error);
    return null;
  }
}

// ============================================================================
// TESTE 9: TESTAR ERRO - DADOS INVÁLIDOS
// ============================================================================
async function testInvalidData(matriculaId) {
  printSection('TESTE 9: Testar Erro - Dados Inválidos');
  
  const invalidData = {
    raisedhands: -5,  // Valor negativo (inválido)
    VisITedResources: 20,
    AnnouncementsView: 10,
    Discussion: 8,
    ParentAnsweringSurvey: 'Yes',
    ParentschoolSatisfaction: 'Good',
    StudentAbsenceDays: 'Under-7'
  };
  
  try {
    await axios.post(
      `${BASE_URL}/predictions/generate`,
      {
        IDMatricula: matriculaId,
        TipoPredicao: 'EVASAO',
        dados: invalidData
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    printError('ERRO: Deveria ter retornado erro para dados inválidos!');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      printSuccess('Erro esperado capturado corretamente!', error.response.data);
    } else {
      printError('Erro inesperado', error);
    }
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================
async function runAllTests() {
  console.log('\n🚀 Iniciando testes de Predição de Evasão...\n');
  
  // Teste 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Falha no login. Abortando testes.\n');
    return;
  }
  
  await delay(500);
  
  // Teste 2: Obter dados do usuário
  const aluno = await testGetUserData();
  if (!aluno) {
    console.log('\n❌ Não foi possível obter dados do aluno. Abortando testes.\n');
    return;
  }
  
  await delay(500);
  
  // Teste 3: Buscar matrículas
  const matricula = await testGetMatriculas(aluno.IDAluno);
  if (!matricula) {
    console.log('\n❌ Não foi possível obter matrícula. Abortando testes.\n');
    return;
  }
  
  await delay(500);
  
  // Teste 4: Verificar serviço de ML
  const mlAvailable = await testMLServiceHealth();
  if (!mlAvailable) {
    console.log('\n⚠️  Serviço de ML não está disponível. Os testes de predição podem falhar.\n');
  }
  
  await delay(500);
  
  // Teste 5: Predição baixo risco
  await testPredictionLowRisk(matricula.IDMatricula);
  await delay(1000);
  
  // Teste 6: Predição médio risco
  await testPredictionMediumRisk(matricula.IDMatricula);
  await delay(1000);
  
  // Teste 7: Predição alto risco
  await testPredictionHighRisk(matricula.IDMatricula);
  await delay(1000);
  
  // Teste 8: Buscar predições salvas
  await testGetPredictions(matricula.IDMatricula);
  await delay(500);
  
  // Teste 9: Testar erro
  await testInvalidData(matricula.IDMatricula);
  
  // Resumo final
  printSection('RESUMO DOS TESTES');
  console.log('✅ Testes concluídos!');
  console.log('\nVerifique os resultados acima para garantir que tudo está funcionando corretamente.\n');
}

// ============================================================================
// EXECUTAR
// ============================================================================
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };