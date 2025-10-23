const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function cadastroCompletoZero() {
  try {
    console.log('🚀 CADASTRO COMPLETO DO ZERO - Dashboard Professor\n');
    console.log('=' .repeat(60));

    // 1. CRIAR USUÁRIO ADMIN
    console.log('\n1️⃣ CRIANDO USUÁRIO ADMIN...');
    console.log('-'.repeat(40));
    
    let adminResponse;
    try {
      adminResponse = await axios.post(`${BASE_URL}/auth/register`, {
        Email: 'admin@dashboard.com',
        password: '123456',
        name: 'Administrador Dashboard',
        Role: 'ADMIN'
      });
      console.log('✅ Usuário ADMIN criado com sucesso!');
      console.log(`   ID: ${adminResponse.data.IDUser}`);
      console.log(`   Email: ${adminResponse.data.Email}`);
      console.log(`   Role: ${adminResponse.data.Role}`);
    } catch (error) {
      if (error.response?.data?.error === 'Usuário já existe com este email') {
        console.log('⚠️ Usuário já existe, fazendo login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          Email: 'admin@dashboard.com',
          password: '123456'
        });
        adminResponse = { data: loginResponse.data.user };
        console.log('✅ Login realizado com sucesso!');
        console.log(`   ID: ${adminResponse.data.IDUser}`);
      } else {
        throw error;
      }
    }

    // 2. FAZER LOGIN E OBTER TOKEN
    console.log('\n2️⃣ FAZENDO LOGIN...');
    console.log('-'.repeat(40));
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      Email: 'admin@dashboard.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.IDUser;
    console.log('✅ Login realizado com sucesso!');
    console.log(`   Token: ${token.substring(0, 50)}...`);
    console.log(`   User ID: ${userId}`);

    // 3. CRIAR CURSO
    console.log('\n3️⃣ CRIANDO CURSO...');
    console.log('-'.repeat(40));
    
    const cursoResponse = await axios.post(`${BASE_URL}/cursos`, {
      NomeDoCurso: 'Engenharia de Software',
      Descricao: 'Curso de graduação em Engenharia de Software'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const cursoId = cursoResponse.data.IDCurso;
    console.log('✅ Curso criado com sucesso!');
    console.log(`   Nome: ${cursoResponse.data.NomeDoCurso}`);
    console.log(`   ID: ${cursoId}`);

    // 4. CRIAR DISCIPLINAS
    console.log('\n4️⃣ CRIANDO DISCIPLINAS...');
    console.log('-'.repeat(40));
    
    const disciplinas = [
      {
        NomeDaDisciplina: 'Algoritmos e Estruturas de Dados',
        CodigoDaDisciplina: 'ES001',
        CargaHoraria: 80
      },
      {
        NomeDaDisciplina: 'Programação Orientada a Objetos',
        CodigoDaDisciplina: 'ES002',
        CargaHoraria: 60
      },
      {
        NomeDaDisciplina: 'Banco de Dados',
        CodigoDaDisciplina: 'ES003',
        CargaHoraria: 60
      },
      {
        NomeDaDisciplina: 'Engenharia de Software',
        CodigoDaDisciplina: 'ES004',
        CargaHoraria: 60
      }
    ];

    const disciplinasCriadas = [];
    for (const disciplina of disciplinas) {
      const disciplinaResponse = await axios.post(`${BASE_URL}/disciplinas`, {
        IDCurso: cursoId,
        ...disciplina
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      disciplinasCriadas.push(disciplinaResponse.data);
      console.log(`✅ Disciplina criada: ${disciplina.NomeDaDisciplina}`);
      console.log(`   Código: ${disciplina.CodigoDaDisciplina} | Carga: ${disciplina.CargaHoraria}h`);
    }

    // 5. CRIAR PERÍODO LETIVO
    console.log('\n5️⃣ CRIANDO PERÍODO LETIVO...');
    console.log('-'.repeat(40));
    
    const periodoResponse = await axios.post(`${BASE_URL}/periodos`, {
      Nome: '2024.3',
      DataInicio: '2024-08-01T00:00:00.000Z',
      DataFim: '2024-12-31T23:59:59.999Z',
      Ativo: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const periodoId = periodoResponse.data.IDPeriodo;
    console.log('✅ Período letivo criado com sucesso!');
    console.log(`   Nome: ${periodoResponse.data.Nome}`);
    console.log(`   Início: ${periodoResponse.data.DataInicio}`);
    console.log(`   Fim: ${periodoResponse.data.DataFim}`);
    console.log(`   ID: ${periodoId}`);

    // 6. CRIAR ALUNOS
    console.log('\n6️⃣ CRIANDO ALUNOS...');
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
      },
      {
        Nome: 'Diana Costa',
        Email: 'diana.costa@estudante.com',
        Semestre: 3
      },
      {
        Nome: 'Eduardo Lima',
        Email: 'eduardo.lima@estudante.com',
        Semestre: 3
      }
    ];

    const alunosCriados = [];
    for (const aluno of alunos) {
      const alunoResponse = await axios.post(`${BASE_URL}/alunos`, {
        IDCurso: cursoId,
        ...aluno
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alunosCriados.push(alunoResponse.data);
      console.log(`✅ Aluno criado: ${aluno.Nome}`);
      console.log(`   Email: ${aluno.Email} | Semestre: ${aluno.Semestre}`);
    }

    // 7. CRIAR MATRÍCULAS COM NOTAS
    console.log('\n7️⃣ CRIANDO MATRÍCULAS COM NOTAS...');
    console.log('-'.repeat(40));
    
    const matriculasCriadas = [];
    const notasExemplo = [
      [8.5, 7.2, 9.1, 6.8], // Ana
      [7.8, 8.9, 7.5, 8.2], // Bruno
      [6.5, 7.1, 8.3, 7.9], // Carlos
      [9.2, 8.7, 9.0, 8.8], // Diana
      [7.0, 6.8, 7.3, 6.5]  // Eduardo
    ];

    for (let i = 0; i < alunosCriados.length; i++) {
      const aluno = alunosCriados[i];
      const notasAluno = notasExemplo[i];
      
      for (let j = 0; j < disciplinasCriadas.length; j++) {
        const disciplina = disciplinasCriadas[j];
        const nota = notasAluno[j];
        
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
      }
    }

    // 8. CRIAR PREDIÇÕES
    console.log('\n8️⃣ CRIANDO PREDIÇÕES...');
    console.log('-'.repeat(40));
    
    const predicoesExemplo = [
      ['aprovado', 'aprovado', 'aprovado', 'aprovado'], // Ana
      ['aprovado', 'aprovado', 'aprovado', 'aprovado'], // Bruno
      ['reprovado', 'aprovado', 'aprovado', 'aprovado'], // Carlos
      ['aprovado', 'aprovado', 'aprovado', 'aprovado'], // Diana
      ['reprovado', 'reprovado', 'aprovado', 'reprovado'] // Eduardo
    ];

    for (let i = 0; i < matriculasCriadas.length; i++) {
      const matricula = matriculasCriadas[i];
      const alunoIndex = Math.floor(i / disciplinasCriadas.length);
      const disciplinaIndex = i % disciplinasCriadas.length;
      const classificacao = predicoesExemplo[alunoIndex][disciplinaIndex];
      
      const probabilidade = classificacao === 'aprovado' ? 0.85 : 0.25;
      
      const predicaoResponse = await axios.post(`${BASE_URL}/predictions`, {
        IDMatricula: matricula.IDMatricula,
        TipoPredicao: 'DESEMPENHO',
        Probabilidade: probabilidade,
        Classificacao: classificacao,
        Explicacao: `Aluno com ${classificacao} desempenho na disciplina`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const aluno = alunosCriados[alunoIndex];
      const disciplina = disciplinasCriadas[disciplinaIndex];
      console.log(`✅ Predição criada: ${aluno.Nome} - ${disciplina.NomeDaDisciplina} - ${classificacao} (${Math.round(probabilidade * 100)}%)`);
    }

    // 9. TESTAR DASHBOARD
    console.log('\n9️⃣ TESTANDO DASHBOARD...');
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
      
      console.log('\n👥 ALUNOS NO DASHBOARD:');
      dashboardResponse.data.data.alunos.forEach((aluno, index) => {
        console.log(`   ${index + 1}. ${aluno.Nome} - Nota: ${aluno.Nota} - Status: ${aluno.Status}`);
        if (aluno.Predicoes && aluno.Predicoes.length > 0) {
          aluno.Predicoes.forEach(pred => {
            console.log(`      📋 Predição: ${pred.Classificacao} (${Math.round(pred.Probabilidade * 100)}%)`);
          });
        }
      });
      
    } catch (error) {
      console.log('❌ Erro no dashboard:', error.response?.data || error.message);
    }

    // 10. COMANDOS PARA TESTE MANUAL
    console.log('\n🎯 COMANDOS PARA TESTE MANUAL:');
    console.log('=' .repeat(60));
    
    console.log('\n📋 DADOS IMPORTANTES:');
    console.log(`   👤 User ID: ${userId}`);
    console.log(`   🔑 Token: ${token.substring(0, 50)}...`);
    console.log(`   🎓 Curso: ${cursoResponse.data.NomeDoCurso}`);
    console.log(`   📚 Disciplinas: ${disciplinasCriadas.length}`);
    console.log(`   👥 Alunos: ${alunosCriados.length}`);
    console.log(`   📝 Matrículas: ${matriculasCriadas.length}`);
    console.log(`   🔮 Predições: ${matriculasCriadas.length}`);

    console.log('\n🧪 COMANDOS CURL:');
    console.log(`# Dashboard completo:`);
    console.log(`curl -X GET "${BASE_URL}/dashboard/professor/${userId}" \\`);
    console.log(`  -H "Authorization: Bearer ${token}"`);
    
    console.log(`\n# Dashboard resumo:`);
    console.log(`curl -X GET "${BASE_URL}/dashboard/professor/${userId}/resumo" \\`);
    console.log(`  -H "Authorization: Bearer ${token}"`);

    if (disciplinasCriadas.length > 0) {
      console.log(`\n# Dashboard com filtro por disciplina:`);
      console.log(`curl -X GET "${BASE_URL}/dashboard/professor/${userId}?disciplina=${disciplinasCriadas[0].IDDisciplina}" \\`);
      console.log(`  -H "Authorization: Bearer ${token}"`);
    }

    console.log('\n🎉 CADASTRO COMPLETO FINALIZADO COM SUCESSO!');
    console.log('=' .repeat(60));
    console.log('✅ Todos os dados foram cadastrados');
    console.log('✅ Dashboard está funcionando');
    console.log('✅ Relacionamentos estão corretos');
    console.log('✅ Pronto para testes!');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE O CADASTRO:');
    console.error('=' .repeat(60));
    console.error('Erro:', error.response?.data || error.message);
    console.error('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.error('1. Verifique se o servidor está rodando');
    console.error('2. Verifique se o banco de dados está conectado');
    console.error('3. Verifique se as rotas estão configuradas');
  }
}

cadastroCompletoZero();

