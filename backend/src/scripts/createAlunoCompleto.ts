/**
 * Script para criar aluno aluno@dashboard.com completo:
 * - Cria usuário e aluno (se não existir)
 * - Matricula em todas as disciplinas
 * - Cria notas aleatórias para o período 2025.2
 */

import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

interface NotaData {
  Tipo: string;
  Valor: number;
  DataAvaliacao: Date;
  Observacoes?: string;
}

async function createAlunoCompleto() {
  try {
    console.log('🚀 Criando aluno completo: aluno@dashboard.com');
    console.log('='.repeat(60));

    // 1. Verificar se o aluno já existe
    let aluno = await prisma.aluno.findUnique({
      where: {
        Email: 'aluno@dashboard.com',
      },
      include: {
        user: true,
        curso: true,
        matriculas: {
          include: {
            disciplina: true,
            periodo: true,
          },
        },
      },
    });

    // 2. Buscar ou criar usuário
    let user = await prisma.user.findUnique({
      where: {
        Email: 'aluno@dashboard.com',
      },
    });

    if (!user) {
      console.log('\n👤 Criando usuário...');
      const passwordHash = await bcrypt.hash('123456', 10);
      
      user = await prisma.user.create({
        data: {
          Email: 'aluno@dashboard.com',
          PasswordHash: passwordHash,
          Role: 'STUDENT',
          name: 'Aluno Dashboard',
        },
      });
      console.log(`✅ Usuário criado: ${user.Email} (ID: ${user.IDUser})`);
      console.log(`   Senha padrão: 123456`);
    } else {
      console.log(`✅ Usuário já existe: ${user.Email} (ID: ${user.IDUser})`);
    }

    // 3. Buscar ou criar curso
    let curso = await prisma.curso.findFirst({
      where: {
        NomeDoCurso: {
          contains: 'Sistemas',
          mode: 'insensitive',
        },
      },
    });

    if (!curso) {
      console.log('\n📚 Criando curso padrão...');
      curso = await prisma.curso.create({
        data: {
          NomeDoCurso: 'Sistemas de Informação',
          Descricao: 'Curso de Sistemas de Informação',
        },
      });
      console.log(`✅ Curso criado: ${curso.NomeDoCurso} (ID: ${curso.IDCurso})`);
    } else {
      console.log(`✅ Curso encontrado: ${curso.NomeDoCurso} (ID: ${curso.IDCurso})`);
    }

    // 4. Criar aluno se não existir
    if (!aluno) {
      console.log('\n🎓 Criando aluno...');
      aluno = await prisma.aluno.create({
        data: {
          Nome: 'Aluno Dashboard',
          Email: 'aluno@dashboard.com',
          Semestre: 1,
          IDCurso: curso.IDCurso,
          IDUser: user.IDUser,
        },
        include: {
          user: true,
          curso: true,
          matriculas: {
            include: {
              disciplina: true,
              periodo: true,
            },
          },
        },
      });
      console.log(`✅ Aluno criado: ${aluno.Nome} (ID: ${aluno.IDAluno})`);
    } else {
      console.log(`✅ Aluno já existe: ${aluno.Nome} (ID: ${aluno.IDAluno})`);
    }

    // 5. Buscar ou criar período 2025.2
    let periodo = await prisma.periodoLetivo.findFirst({
      where: {
        Nome: '2025.2',
      },
    });

    if (!periodo) {
      console.log('\n📅 Criando período 2025.2...');
      periodo = await prisma.periodoLetivo.create({
        data: {
          Nome: '2025.2',
          DataInicio: new Date('2025-08-01'),
          DataFim: new Date('2025-12-31'),
          Ativo: true,
        },
      });
      console.log(`✅ Período criado: ${periodo.Nome} (ID: ${periodo.IDPeriodo})`);
    } else {
      console.log(`✅ Período encontrado: ${periodo.Nome} (ID: ${periodo.IDPeriodo})`);
    }

    // 6. Buscar todas as disciplinas
    console.log('\n📖 Buscando todas as disciplinas...');
    const disciplinas = await prisma.disciplina.findMany({
      orderBy: {
        NomeDaDisciplina: 'asc',
      },
    });

    if (disciplinas.length === 0) {
      console.error('❌ Nenhuma disciplina encontrada no banco de dados.');
      console.log('💡 Crie disciplinas primeiro.');
      return;
    }

    console.log(`✅ Encontradas ${disciplinas.length} disciplinas:`);
    disciplinas.forEach((disc, index) => {
      console.log(`   ${index + 1}. ${disc.NomeDaDisciplina}`);
    });

    // 7. Criar matrículas para todas as disciplinas no período 2025.2
    console.log('\n📝 Criando matrículas...');
    let matriculasCriadas = 0;
    let matriculasExistentes = 0;

    for (const disciplina of disciplinas) {
      // Verificar se já existe matrícula
      const matriculaExistente = await prisma.matricula.findFirst({
        where: {
          IDAluno: aluno.IDAluno,
          IDDisciplina: disciplina.IDDisciplina,
          IDPeriodo: periodo.IDPeriodo,
        },
      });

      if (matriculaExistente) {
        console.log(`   ⚠️  Matrícula já existe: ${disciplina.NomeDaDisciplina}`);
        matriculasExistentes++;
        continue;
      }

      // Criar matrícula
      try {
        const matricula = await prisma.matricula.create({
          data: {
            IDAluno: aluno.IDAluno,
            IDDisciplina: disciplina.IDDisciplina,
            IDPeriodo: periodo.IDPeriodo,
            Status: 'ENROLLED',
          },
        });
        console.log(`   ✅ Matrícula criada: ${disciplina.NomeDaDisciplina} (ID: ${matricula.IDMatricula})`);
        matriculasCriadas++;
      } catch (error: any) {
        console.error(`   ❌ Erro ao criar matrícula para ${disciplina.NomeDaDisciplina}:`, error.message);
      }
    }

    console.log(`\n📊 Resumo de matrículas:`);
    console.log(`   Criadas: ${matriculasCriadas}`);
    console.log(`   Já existentes: ${matriculasExistentes}`);

    // 8. Buscar todas as matrículas do período 2025.2
    const matriculas = await prisma.matricula.findMany({
      where: {
        IDAluno: aluno.IDAluno,
        IDPeriodo: periodo.IDPeriodo,
      },
      include: {
        disciplina: true,
        periodo: true,
      },
    });

    console.log(`\n📚 Total de matrículas no período ${periodo.Nome}: ${matriculas.length}`);

    // 9. Criar notas aleatórias para cada matrícula
    console.log('\n📝 Criando notas aleatórias...');
    let totalNotasCriadas = 0;

    // Tipos de avaliação comuns
    const tiposAvaliacao = ['P1', 'P2', 'P3', 'Trabalho', 'Atividade', 'Projeto', 'Avaliação Contínua'];
    
    // Datas base para o período 2025.2 (agosto a dezembro)
    const dataInicio = new Date('2025-08-01');
    const dataFim = new Date('2025-12-31');

    for (const matricula of matriculas) {
      console.log(`\n📖 Processando: ${matricula.disciplina.NomeDaDisciplina}`);

      // Verificar se já existem notas
      const notasExistentes = await prisma.nota.count({
        where: { IDMatricula: matricula.IDMatricula },
      });

      if (notasExistentes > 0) {
        console.log(`   ⚠️  Já existem ${notasExistentes} nota(s). Pulando...`);
        continue;
      }

      // Gerar 4-6 notas aleatórias por disciplina
      const numNotas = Math.floor(Math.random() * 3) + 4; // 4 a 6 notas
      const notasPorMatricula: NotaData[] = [];

      for (let i = 0; i < numNotas; i++) {
        // Nota aleatória entre 40 e 100
        const valor = Math.floor(Math.random() * 61) + 40; // 40 a 100
        
        // Tipo aleatório
        const tipo = tiposAvaliacao[Math.floor(Math.random() * tiposAvaliacao.length)];
        
        // Data aleatória dentro do período
        const diasAleatorios = Math.floor(Math.random() * ((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
        const dataAvaliacao = new Date(dataInicio);
        dataAvaliacao.setDate(dataAvaliacao.getDate() + diasAleatorios);

        notasPorMatricula.push({
          Tipo: tipo,
          Valor: valor,
          DataAvaliacao: dataAvaliacao,
          Observacoes: `${tipo} - ${matricula.disciplina.NomeDaDisciplina}`,
        });
      }

      // Criar notas
      for (const notaData of notasPorMatricula) {
        try {
          const nota = await prisma.nota.create({
            data: {
              IDMatricula: matricula.IDMatricula,
              Valor: notaData.Valor,
              Tipo: notaData.Tipo,
              DataAvaliacao: notaData.DataAvaliacao,
              Observacoes: notaData.Observacoes,
            },
          });

          console.log(`   ✅ Nota criada: ${notaData.Tipo} - ${notaData.Valor} pontos (${notaData.DataAvaliacao.toLocaleDateString('pt-BR')})`);
          totalNotasCriadas++;

          // Atualizar a média da matrícula
          await updateMatriculaAverage(matricula.IDMatricula);
        } catch (error: any) {
          console.error(`   ❌ Erro ao criar nota ${notaData.Tipo}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`📊 Resumo:`);
    console.log(`   - Aluno: ${aluno.Nome} (${aluno.Email})`);
    console.log(`   - Período: ${periodo.Nome}`);
    console.log(`   - Matrículas: ${matriculas.length}`);
    console.log(`   - Notas criadas: ${totalNotasCriadas}`);

  } catch (error: any) {
    console.error('❌ Erro ao criar aluno completo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Atualiza a média de uma matrícula baseada nas notas
 */
async function updateMatriculaAverage(matriculaId: string) {
  try {
    const notas = await prisma.nota.findMany({
      where: { IDMatricula: matriculaId },
      select: { Valor: true },
    });

    const totalNotas = notas.length;
    const somaNotas = notas.reduce((sum: number, nota: { Valor: number }) => sum + nota.Valor, 0);
    const media = totalNotas > 0 ? somaNotas / totalNotas : null;

    await prisma.matricula.update({
      where: { IDMatricula: matriculaId },
      data: { Nota: media },
    });
  } catch (error: any) {
    console.error(`   ⚠️  Erro ao atualizar média:`, error.message);
  }
}

// Executar o script
if (require.main === module) {
  createAlunoCompleto()
    .then(() => {
      console.log('\n🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro ao executar script:', error);
      process.exit(1);
    });
}

export { createAlunoCompleto };

