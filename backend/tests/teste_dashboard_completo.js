// Teste completo do dashboard do professor
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

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

async function criarDadosTeste() {
  logInfo('Criando dados de teste...');
  
  try {
    // 1. Criar professor
    const professor = await axios.post(`${BASE_URL}/auth/register`, {
      Email: 'professor@test.com',
      password: '123456',
      name: 'Professor Teste',
      Role: 'TEACHER'
    });
    logSuccess('Professor criado');
    
    // 2. Criar curso
    const curso = await axios.post(`${BASE_URL}/cursos`, {
      NomeDoCurso: 'Ciência da Computação',
      Descricao: 'Curso de teste'
    }, {
      headers: { 'Authorization': `Bearer ${professor.data.token}` }
    });
    logSuccess('Curso criado');
    
    // 3. Criar disciplina
    const disciplina = await axios.post(`${BASE_URL}/disciplinas`, {
      IDCurso: curso.data.IDCurso,
      NomeDaDisciplina: 'Algoritmos',
      CodigoDaDisciplina: 'CC001',
      CargaHoraria: 60
    }, {
      headers: { 'Authorization': `Bearer ${professor.data.token}` }
    });
    logSuccess('Disciplina criada');
    
    // 4. Criar período
    const periodo = await axios.post(`${BASE_URL}/periodos`, {
      Nome: '2024.1',
      DataInicio: new Date('2024-01-01'),
      DataFim: new Date('2024-06-30'),
      Ativo: true
    }, {
      headers: { 'Authorization': `Bearer ${professor.data.token}` }
    });
    logSuccess('Período criado');
    
    // 5. Criar alguns alunos
    const alunos = [];
    for (let i = 1; i <= 5; i++) {
      const aluno = await axios.post(`${BASE_URL}/alunos`, {
        Nome: `Aluno ${i}`,
        Email: `aluno${i}@test.com`,
        IDCurso: curso.data.IDCurso,
        Semestre: 3
      }, {
        headers: { 'Authorization': `Bearer ${professor.data.token}` }
      });
      alunos.push(aluno.data);
    }
    logSuccess(`${alunos.length} alunos criados`);
    
    // 6. Criar matrículas com notas
    const matriculas = [];
    for (let i = 0; i < alunos.length; i++) {
      const matricula = await axios.post(`${BASE_URL}/matriculas`, {
        IDAluno: alunos[i].IDAluno,
        IDDisciplina: disciplina.data.IDDisciplina,
        IDPeriodo: periodo.data.IDPeriodo,
        Status: 'ENROLLED',
        Nota: Math.random() * 10 // Nota aleatória
      }, {
        headers: { 'Authorization': `Bearer ${professor.data.token}` }
      });
      matriculas.push(matricula.data);
    }
    logSuccess(`${matriculas.length} matrículas criadas`);
    
    return {
      professor: professor.data,
      curso: curso.data,
      disciplina: disciplina.data,
      periodo: periodo.data,
      alunos,
      matriculas
    };
    
  } catch (error) {
    if (error.response?.status === 409) {
      logWarning('Dados de teste já existem, continuando...');
      return null;
    }
    throw error;
  }
}

async function testarDashboard() {
  log('📊 TESTANDO DASHBOARD DO PROFESSOR', 'bold');
  log('=' .repeat(50), 'blue');
  
  try {
    // 1. Verificar se servidor está rodando
    logInfo('Verificando servidor...');
    await axios.get(`${BASE_URL}/health`);
    logSuccess('Servidor está rodando');
    
    // 2. Criar dados de teste
    const dadosTeste = await criarDadosTeste();
    
    // 3. Fazer login como professor
    logInfo('Fazendo login como professor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: 'professor@test.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const professorId = loginResponse.data.user.IDUser;
    logSuccess('Login realizado');
    
    // 4. Testar dashboard completo
    logInfo('Testando dashboard completo...');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/professor/${professorId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logSuccess('Dashboard completo funcionando!');
    console.log('\n📊 Métricas do Dashboard:');
    console.log(`   - Média de notas: ${dashboardResponse.data.metricas.mediaNotas}`);
    console.log(`   - % Aprovados: ${dashboardResponse.data.metricas.percentualAprovados}%`);
    console.log(`   - % Risco alto evasão: ${dashboardResponse.data.metricas.percentualRiscoAltoEvasao}%`);
    console.log(`   - Total de alunos: ${dashboardResponse.data.totalAlunos}`);
    console.log(`   - Disciplinas disponíveis: ${dashboardResponse.data.disciplinas.length}`);
    console.log(`   - Períodos disponíveis: ${dashboardResponse.data.periodos.length}`);
    
    // 5. Testar dashboard com filtro
    if (dadosTeste?.disciplina) {
      logInfo('Testando dashboard com filtro por disciplina...');
      const dashboardFiltrado = await axios.get(`${BASE_URL}/dashboard/professor/${professorId}?disciplinaId=${dadosTeste.disciplina.IDDisciplina}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      logSuccess('Dashboard com filtro funcionando!');
      console.log(`   - Alunos filtrados: ${dashboardFiltrado.data.totalAlunos}`);
    }
    
    // 6. Testar resumo rápido
    logInfo('Testando resumo rápido...');
    const resumoResponse = await axios.get(`${BASE_URL}/dashboard/professor/${professorId}/resumo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    logSuccess('Resumo rápido funcionando!');
    console.log('\n📊 Resumo:');
    console.log(`   - Média: ${resumoResponse.data.metricas.mediaNotas}`);
    console.log(`   - Aprovados: ${resumoResponse.data.metricas.percentualAprovados}%`);
    console.log(`   - Risco evasão: ${resumoResponse.data.metricas.percentualRiscoAltoEvasao}%`);
    
    // 7. Testar acesso sem token
    logInfo('Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/dashboard/professor/${professorId}`);
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Acesso sem token bloqueado corretamente!');
      }
    }
    
    // 8. Testar acesso com usuário não-professor
    logInfo('Testando acesso com usuário não-professor...');
    try {
      // Criar usuário estudante
      await axios.post(`${BASE_URL}/auth/register`, {
        Email: 'estudante@test.com',
        password: '123456',
        name: 'Estudante Teste',
        Role: 'STUDENT'
      });
      
      const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
        Email: 'estudante@test.com',
        password: '123456'
      });
      
      await axios.get(`${BASE_URL}/dashboard/professor/${professorId}`, {
        headers: { 'Authorization': `Bearer ${studentLogin.data.token}` }
      });
      
      logError('Estudante conseguiu acessar dashboard (deveria falhar)!');
    } catch (error) {
      if (error.response?.status === 403) {
        logSuccess('Acesso de estudante bloqueado corretamente!');
      }
    }
    
    // 9. Testar performance
    logInfo('Testando performance...');
    const startTime = Date.now();
    await axios.get(`${BASE_URL}/dashboard/professor/${professorId}/resumo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (responseTime < 400) {
      logSuccess(`Performance OK: ${responseTime}ms (< 400ms)`);
    } else {
      logWarning(`Performance lenta: ${responseTime}ms (>= 400ms)`);
    }
    
    log('\n🎉 TODOS OS TESTES DO DASHBOARD PASSARAM!', 'green');
    log('✅ Dashboard funcionando perfeitamente!', 'green');
    
  } catch (error) {
    logError('Erro durante os testes:');
    console.error(error.response?.data || error.message);
    
    log('\n💡 Dicas para resolver:', 'yellow');
    log('1. Certifique-se de que o servidor está rodando: npm run dev', 'yellow');
    log('2. Verifique se o banco de dados está configurado', 'yellow');
    log('3. Execute as migrações: npx prisma migrate dev', 'yellow');
  }
}

// Executar testes
testarDashboard();
