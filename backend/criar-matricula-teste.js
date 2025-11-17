/**
 * Script para criar uma matrícula de teste para o aluno
 * 
 * Como usar:
 * 1. Certifique-se de que o backend está rodando
 * 2. Execute: node criar-matricula-teste.js
 * 
 * IMPORTANTE: Edite as variáveis no início do arquivo com seus dados reais!
 */

const axios = require('axios');

// ============================================================================
// CONFIGURAÇÕES - EDITE AQUI COM SEUS DADOS REAIS
// ============================================================================
const BASE_URL = 'http://localhost:8080/api';

// Credenciais de login (ADMIN ou TEACHER)
const LOGIN_EMAIL = 'admin@teste.com';  // ⚠️ ALTERE AQUI - Use um usuário ADMIN ou TEACHER
const LOGIN_PASSWORD = 'admin123';        // ⚠️ ALTERE AQUI

// ID do aluno (você pode pegar do teste anterior)
const ID_ALUNO = 'f9e2848a-daf8-4ddc-8538-6663b00b3e6d';  // ⚠️ ALTERE AQUI se necessário

// ============================================================================
// FUNÇÕES
// ============================================================================

let authToken = null;

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      Email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    });
    
    authToken = response.data.token;
    console.log('✅ Login realizado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.response?.data || error.message);
    return false;
  }
}

async function buscarDisciplinas(cursoId = null) {
  try {
    let url = `${BASE_URL}/disciplinas`;
    if (cursoId) {
      url = `${BASE_URL}/disciplinas/curso/${cursoId}`;
    }
    
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    // A resposta pode ser um array ou um objeto com propriedade data
    const disciplinas = Array.isArray(response.data) ? response.data : (response.data.data || response.data.disciplinas || []);
    
    if (!disciplinas || disciplinas.length === 0) {
      console.log('⚠️  Nenhuma disciplina encontrada. Criando uma disciplina de teste...');
      return await criarDisciplinaTeste(cursoId);
    }
    
    console.log(`✅ Encontradas ${disciplinas.length} disciplinas`);
    return disciplinas[0]; // Retorna a primeira disciplina
  } catch (error) {
    console.error('❌ Erro ao buscar disciplinas:', error.response?.data || error.message);
    console.log('Tentando criar disciplina de teste...');
    return await criarDisciplinaTeste(cursoId);
  }
}

async function criarDisciplinaTeste(cursoId = null) {
  try {
    let curso = null;
    
    if (cursoId) {
      // Se um cursoId foi fornecido, busca esse curso específico
      try {
        const cursoResponse = await axios.get(`${BASE_URL}/cursos/${cursoId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        curso = cursoResponse.data;
      } catch (error) {
        console.error('❌ Erro ao buscar curso específico:', error.response?.data || error.message);
      }
    }
    
    // Se não encontrou o curso específico, busca qualquer curso
    if (!curso) {
      const cursosResponse = await axios.get(`${BASE_URL}/cursos`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const cursos = Array.isArray(cursosResponse.data) ? cursosResponse.data : (cursosResponse.data.data || []);
      
      if (!cursos || cursos.length === 0) {
        console.error('❌ Nenhum curso encontrado. Crie um curso primeiro!');
        return null;
      }
      
      curso = cursos[0];
    }
    
    // Cria uma disciplina de teste
    const disciplinaResponse = await axios.post(
      `${BASE_URL}/disciplinas`,
      {
        NomeDaDisciplina: 'Algoritmos e Estruturas de Dados',
        CodigoDaDisciplina: 'CC101',
        CargaHoraria: 60,
        IDCurso: curso.IDCurso
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Disciplina de teste criada!');
    return disciplinaResponse.data;
  } catch (error) {
    console.error('❌ Erro ao criar disciplina:', error.response?.data || error.message);
    return null;
  }
}

async function buscarPeriodos() {
  try {
    const response = await axios.get(`${BASE_URL}/periodos`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    // A resposta pode ser um array ou um objeto com propriedade data
    const periodos = Array.isArray(response.data) ? response.data : (response.data.data || response.data.periodos || []);
    
    if (!periodos || periodos.length === 0) {
      console.log('⚠️  Nenhum período letivo encontrado. Criando um período de teste...');
      return await criarPeriodoTeste();
    }
    
    console.log(`✅ Encontrados ${periodos.length} períodos letivos`);
    return periodos[0]; // Retorna o primeiro período
  } catch (error) {
    console.error('❌ Erro ao buscar períodos:', error.response?.data || error.message);
    console.log('Tentando criar período de teste...');
    return await criarPeriodoTeste();
  }
}

async function criarPeriodoTeste() {
  try {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 6, 0);
    
    const periodoResponse = await axios.post(
      `${BASE_URL}/periodos`,
      {
        Nome: `${hoje.getFullYear()}.${hoje.getMonth() + 1}`,
        DataInicio: inicio.toISOString(),
        DataFim: fim.toISOString(),
        Ativo: true
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Período letivo de teste criado!');
    return periodoResponse.data;
  } catch (error) {
    console.error('❌ Erro ao criar período:', error.response?.data || error.message);
    return null;
  }
}

async function criarMatricula(alunoId, disciplinaId, periodoId) {
  try {
    const response = await axios.post(
      `${BASE_URL}/matriculas`,
      {
        IDAluno: alunoId,
        IDDisciplina: disciplinaId,
        IDPeriodo: periodoId,
        Status: 'ENROLLED'
      },
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ Matrícula criada com sucesso!');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar matrícula:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('\n🚀 Criando matrícula de teste...\n');
  
  // 1. Login
  if (!await login()) {
    console.log('\n❌ Falha no login. Abortando.\n');
    return;
  }
  
  // 2. Buscar dados do aluno para verificar o curso
  let aluno = null;
  try {
    const alunoResponse = await axios.get(`${BASE_URL}/alunos/${ID_ALUNO}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    aluno = alunoResponse.data;
    console.log(`✅ Aluno encontrado: ${aluno.Nome} - Curso: ${aluno.curso?.NomeDoCurso || 'N/A'}`);
  } catch (error) {
    console.error('❌ Erro ao buscar aluno:', error.response?.data || error.message);
    console.log('\n❌ Não foi possível obter dados do aluno. Abortando.\n');
    return;
  }
  
  // 3. Buscar ou criar disciplina (do mesmo curso do aluno)
  let disciplina = await buscarDisciplinas(aluno.IDCurso);
  if (!disciplina) {
    console.log('\n❌ Não foi possível obter disciplina. Abortando.\n');
    return;
  }
  
  // Verificar se a disciplina pertence ao mesmo curso do aluno
  if (disciplina.IDCurso !== aluno.IDCurso) {
    console.log(`⚠️  A disciplina encontrada pertence a outro curso. Criando disciplina no curso do aluno...`);
    const disciplinaCriada = await criarDisciplinaTeste(aluno.IDCurso);
    if (!disciplinaCriada) {
      console.log('\n❌ Não foi possível criar disciplina. Abortando.\n');
      return;
    }
    disciplina = disciplinaCriada;
  }
  
  // 4. Buscar ou criar período
  const periodo = await buscarPeriodos();
  if (!periodo) {
    console.log('\n❌ Não foi possível obter período. Abortando.\n');
    return;
  }
  
  // 5. Criar matrícula
  const matricula = await criarMatricula(ID_ALUNO, disciplina.IDDisciplina, periodo.IDPeriodo);
  
  if (matricula) {
    console.log('\n✅ Matrícula criada com sucesso!');
    console.log(`\n📋 Agora você pode executar o teste novamente:`);
    console.log(`   node test-predicao-evasao.js\n`);
  } else {
    console.log('\n❌ Falha ao criar matrícula.\n');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { main };

