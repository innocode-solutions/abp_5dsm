const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function cadastroFinalFuncional() {
  try {
    console.log('🚀 CADASTRO FINAL FUNCIONAL - Dashboard Professor\n');
    console.log('=' .repeat(60));

    // 1. FAZER LOGIN
    console.log('1️⃣ FAZENDO LOGIN...');
    console.log('-'.repeat(40));
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: 'admin@dashboard.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.IDUser;
    console.log('✅ Login realizado com sucesso!');
    console.log(`   User ID: ${userId}`);

    // 2. BUSCAR DADOS EXISTENTES
    console.log('\n2️⃣ BUSCANDO DADOS EXISTENTES...');
    console.log('-'.repeat(40));
    
    // Buscar curso
    let cursoId;
    try {
      const cursosResponse = await axios.get(`${BASE_URL}/cursos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cursosResponse.data.length > 0) {
        cursoId = cursosResponse.data[0].IDCurso;
        console.log(`✅ Usando curso existente: ${cursosResponse.data[0].NomeDoCurso}`);
      }
    } catch (error) {
      console.log('❌ Erro ao buscar cursos:', error.response?.data?.error);
      return;
    }

    // Buscar disciplinas
    let disciplinasCriadas = [];
    try {
      const disciplinasResponse = await axios.get(`${BASE_URL}/disciplinas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (disciplinasResponse.data.length > 0) {
        disciplinasCriadas = disciplinasResponse.data;
        console.log(`✅ Usando ${disciplinasResponse.data.length} disciplinas existentes`);
      }
    } catch (error) {
      console.log('❌ Erro ao buscar disciplinas:', error.response?.data?.error);
      return;
    }

    // Buscar período
    let periodoId;
    try {
      const periodosResponse = await axios.get(`${BASE_URL}/periodos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (periodosResponse.data.length > 0) {
        periodoId = periodosResponse.data[0].IDPeriodo;
        console.log(`✅ Usando período existente: ${periodosResponse.data[0].Nome}`);
      }
    } catch (error) {
      console.log('❌ Erro ao buscar períodos:', error.response?.data?.error);
      return;
    }

    // 3. CRIAR ALUNOS
    console.log('\n3️⃣ CRIANDO ALUNOS...');
    console.log('-'.repeat(40));
    
    const alunos = [
      {
        Nome: 'Ana Silva',
        Email: 'ana.silva@estudante.com',
        Semestre: 3
      },
      {
        Nome: 'Bruno Santos',
        Email: 'bruno.santos@estudante.com',
        Semestre: 3
      },
      {
        Nome: 'Carlos Oliveira',
        Email: 'carlos.oliveira@estudante.com',
        Semestre: 3
      }
    ];

    const alunosCriados = [];
    for (const aluno of alunos) {
      try {
        const alunoResponse = await axios.post(`${BASE_URL}/alunos`, {
          IDCurso: cursoId,
          ...aluno
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alunosCriados.push(alunoResponse.data);
        console.log(`✅ Aluno criado: ${aluno.Nome}`);
      } catch (error) {
        if (error.response?.data?.error === 'Email already exists') {
          console.log(`⚠️ Aluno ${aluno.Nome} já existe, pulando...`);
        } else {
          console.log(`❌ Erro ao criar aluno ${aluno.Nome}:`, error.response?.data?.error);
        }
      }
    }

    // Se não conseguiu criar alunos, buscar os existentes
    if (alunosCriados.length === 0) {
      try {
        const alunosResponse = await axios.get(`${BASE_URL}/alunos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alunosCriados.push(...alunosResponse.data);
        console.log(`✅ Usando ${alunosResponse.data.length} alunos existentes`);
      } catch (error) {
        console.log('❌ Erro ao buscar alunos existentes:', error.response?.data?.error);
      }
    }

    // 4. CRIAR MATRÍCULAS
    console.log('\n4️⃣ CRIANDO MATRÍCULAS...');
    console.log('-'.repeat(40));
    
    const matriculasCriadas = [];
    const notasExemplo = [
      [8.5, 7.2, 9.1, 6.8], // Ana
      [7.8, 8.9, 7.5, 8.2], // Bruno
      [6.5, 7.1, 8.3, 7.9]  // Carlos
    ];

    for (let i = 0; i < alunosCriados.length; i++) {
      const aluno = alunosCriados[i];
      const notasAluno = notasExemplo[i] || [7.0, 7.0, 7.0, 7.0];
      
      for (let j = 0; j < disciplinasCriadas.length; j++) {
        const disciplina = disciplinasCriadas[j];
        const nota = notasAluno[j];
        
        try {
          const matriculaResponse = await axios.post(`${BASE_URL}/matriculas`, {
            IDAluno: aluno.IDAluno,
            IDDisciplina: disciplina.IDDisciplina,
            IDPeriodo: periodoId,
            Status: 'ENROLLED',
            Nota: nota
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          matriculasCriadas.push(matriculaResponse.data);
          console.log(`✅ Matrícula criada: ${aluno.Nome} em ${disciplina.NomeDaDisciplina} - Nota: ${nota}`);
        } catch (error) {
          if (error.response?.data?.error?.includes('already exists') || error.response?.data?.error?.includes('duplicate')) {
            console.log(`⚠️ Matrícula já existe: ${aluno.Nome} em ${disciplina.NomeDaDisciplina}`);
          } else {
            console.log(`❌ Erro ao criar matrícula:`, error.response?.data?.error);
          }
        }
      }
    }

    // Se não conseguiu criar matrículas, buscar as existentes
    if (matriculasCriadas.length === 0) {
      try {
        const matriculasResponse = await axios.get(`${BASE_URL}/matriculas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        matriculasCriadas.push(...matriculasResponse.data);
        console.log(`✅ Usando ${matriculasResponse.data.length} matrículas existentes`);
      } catch (error) {
        console.log('❌ Erro ao buscar matrículas existentes:', error.response?.data?.error);
      }
    }

    // 5. CRIAR PREDIÇÕES
    console.log('\n5️⃣ CRIANDO PREDIÇÕES...');
    console.log('-'.repeat(40));
    
    for (const matricula of matriculasCriadas) {
      try {
        const probabilidade = Math.random();
        const classificacao = probabilidade > 0.7 ? 'aprovado' : probabilidade > 0.4 ? 'médio' : 'reprovado';
        
        const predicaoResponse = await axios.post(`${BASE_URL}/predictions`, {
          IDMatricula: matricula.IDMatricula,
          TipoPredicao: 'DESEMPENHO',
          Probabilidade: Math.round(probabilidade * 100) / 100,
          Classificacao: classificacao,
          Explicacao: `Aluno com ${classificacao} desempenho`
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ Predição criada: ${classificacao} (${Math.round(probabilidade * 100)}%)`);
      } catch (error) {
        console.log(`❌ Erro ao criar predição:`, error.response?.data?.error);
      }
    }

    // 6. TESTAR DASHBOARD
    console.log('\n6️⃣ TESTANDO DASHBOARD...');
    console.log('-'.repeat(40));
    
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/professor/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard funcionando perfeitamente!');
      console.log('\n📊 DADOS DO DASHBOARD:');
      console.log(`   📈 Total de alunos: ${dashboardResponse.data.data.resumo.totalAlunos}`);
      console.log(`   📊 Média de notas: ${dashboardResponse.data.data.resumo.mediaNotas}`);
      console.log(`   ✅ % Aprovados: ${dashboardResponse.data.data.resumo.percentualAprovados}%`);
      console.log(`   ⚠️ % Risco alto: ${dashboardResponse.data.data.resumo.percentualRiscoAlto}%`);
      
      if (dashboardResponse.data.data.alunos.length > 0) {
        console.log('\n👥 ALUNOS NO DASHBOARD:');
        dashboardResponse.data.data.alunos.forEach((aluno, index) => {
          console.log(`   ${index + 1}. ${aluno.Nome} - Nota: ${aluno.Nota} - Status: ${aluno.Status}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Erro no dashboard:', error.response?.data || error.message);
    }

    // 7. COMANDOS PARA TESTE MANUAL
    console.log('\n🎯 COMANDOS PARA TESTE MANUAL:');
    console.log('=' .repeat(60));
    
    console.log('\n📋 DADOS IMPORTANTES:');
    console.log(`   👤 Professor: admin@dashboard.com`);
    console.log(`   🆔 User ID: ${userId}`);
    console.log(`   🔑 Token: ${token.substring(0, 50)}...`);

    console.log('\n🧪 COMANDOS POWERSHELL:');
    console.log(`# Login:`);
    console.log(`$body = '{"Email":"admin@dashboard.com","password":"123456"}'; iwr "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"`);
    
    console.log(`\n# Dashboard completo:`);
    console.log(`$headers = @{Authorization="Bearer ${token}"}; iwr "http://localhost:3000/api/dashboard/professor/${userId}" -Headers $headers`);
    
    console.log(`\n# Dashboard resumo:`);
    console.log(`$headers = @{Authorization="Bearer ${token}"}; iwr "http://localhost:3000/api/dashboard/professor/${userId}/resumo" -Headers $headers`);

    console.log('\n🎉 CADASTRO FINALIZADO COM SUCESSO!');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE O CADASTRO:');
    console.error('=' .repeat(60));
    console.error('Erro:', error.response?.data || error.message);
  }
}

cadastroFinalFuncional();

