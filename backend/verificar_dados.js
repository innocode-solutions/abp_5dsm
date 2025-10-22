const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function verificarDados() {
  try {
    console.log('🔍 Verificando dados existentes...\n');

    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: 'admin@test.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado!\n');

    // 2. Verificar usuários
    console.log('2️⃣ Verificando usuários...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Usuários encontrados: ${usersResponse.data.length}`);
      usersResponse.data.forEach(user => {
        console.log(`   - ${user.name} (${user.Email}) - ${user.Role}`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar usuários:', error.response?.data?.error);
    }

    // 3. Verificar cursos
    console.log('\n3️⃣ Verificando cursos...');
    try {
      const cursosResponse = await axios.get(`${BASE_URL}/cursos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Cursos encontrados: ${cursosResponse.data.length}`);
      cursosResponse.data.forEach(curso => {
        console.log(`   - ${curso.NomeDoCurso} (ID: ${curso.IDCurso})`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar cursos:', error.response?.data?.error);
    }

    // 4. Verificar disciplinas
    console.log('\n4️⃣ Verificando disciplinas...');
    try {
      const disciplinasResponse = await axios.get(`${BASE_URL}/disciplinas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Disciplinas encontradas: ${disciplinasResponse.data.length}`);
      disciplinasResponse.data.forEach(disciplina => {
        console.log(`   - ${disciplina.NomeDaDisciplina} (ID: ${disciplina.IDDisciplina})`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar disciplinas:', error.response?.data?.error);
    }

    // 5. Verificar períodos
    console.log('\n5️⃣ Verificando períodos...');
    try {
      const periodosResponse = await axios.get(`${BASE_URL}/periodos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Períodos encontrados: ${periodosResponse.data.length}`);
      periodosResponse.data.forEach(periodo => {
        console.log(`   - ${periodo.Nome} (ID: ${periodo.IDPeriodo})`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar períodos:', error.response?.data?.error);
    }

    // 6. Verificar alunos
    console.log('\n6️⃣ Verificando alunos...');
    try {
      const alunosResponse = await axios.get(`${BASE_URL}/alunos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Alunos encontrados: ${alunosResponse.data.length}`);
      alunosResponse.data.forEach(aluno => {
        console.log(`   - ${aluno.Nome} (ID: ${aluno.IDAluno})`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar alunos:', error.response?.data?.error);
    }

    // 7. Verificar matrículas
    console.log('\n7️⃣ Verificando matrículas...');
    try {
      const matriculasResponse = await axios.get(`${BASE_URL}/matriculas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Matrículas encontradas: ${matriculasResponse.data.length}`);
      matriculasResponse.data.forEach(matricula => {
        console.log(`   - Aluno: ${matricula.IDAluno}, Disciplina: ${matricula.IDDisciplina}, Nota: ${matricula.Nota}`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar matrículas:', error.response?.data?.error);
    }

    // 8. Verificar predições
    console.log('\n8️⃣ Verificando predições...');
    try {
      const predictionsResponse = await axios.get(`${BASE_URL}/predictions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Predições encontradas: ${predictionsResponse.data.length}`);
      predictionsResponse.data.forEach(predicao => {
        console.log(`   - Tipo: ${predicao.TipoPredicao}, Classificação: ${predicao.Classificacao}`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar predições:', error.response?.data?.error);
    }

    console.log('\n🎯 Resumo:');
    console.log('   - Se não há disciplinas, execute: node cadastrar_disciplinas.js');
    console.log('   - Se não há dados, execute: node cadastro_simples.js');

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

verificarDados();
