/**
 * Script para criar o aluno aluno@dashboard.com
 * Cria usuário, aluno, curso (se necessário), período (se necessário) e matrículas
 */

import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

async function createAlunoDashboard() {
  try {
    console.log('🚀 Criando aluno aluno@dashboard.com...');
    console.log('=' .repeat(60));

    // 1. Verificar se o aluno já existe
    const alunoExistente = await prisma.aluno.findUnique({
      where: {
        Email: 'aluno@dashboard.com',
      },
      include: {
        user: true,
        matriculas: {
          include: {
            disciplina: true,
            periodo: true,
          },
        },
      },
    });

    if (alunoExistente) {
      console.log('⚠️ Aluno já existe!');
      console.log(`   Nome: ${alunoExistente.Nome}`);
      console.log(`   ID: ${alunoExistente.IDAluno}`);
      console.log(`   Matrículas: ${alunoExistente.matriculas.length}`);
      console.log('\n💡 Se deseja recriar, delete o aluno primeiro.');
      return alunoExistente;
    }

    // 2. Verificar se o usuário já existe
    const userExistente = await prisma.user.findUnique({
      where: {
        Email: 'aluno@dashboard.com',
      },
    });

    if (userExistente) {
      console.log('⚠️ Usuário já existe com este email!');
      console.log(`   ID: ${userExistente.IDUser}`);
      console.log(`   Role: ${userExistente.Role}`);
      
      // Se o usuário existe mas não é aluno, criar o aluno
      if (userExistente.Role !== 'STUDENT') {
        console.log('❌ Usuário existe mas não é STUDENT. Não é possível criar aluno.');
        return;
      }
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
      console.log('📚 Curso não encontrado, criando curso padrão...');
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

    // 4. Buscar ou criar período letivo
    let periodo = await prisma.periodoLetivo.findFirst({
      where: {
        Ativo: true,
      },
    });

    if (!periodo) {
      console.log('📅 Período letivo não encontrado, criando período padrão...');
      const anoAtual = new Date().getFullYear();
      periodo = await prisma.periodoLetivo.create({
        data: {
          Nome: `${anoAtual}.1`,
          DataInicio: new Date(`${anoAtual}-01-01`),
          DataFim: new Date(`${anoAtual}-06-30`),
          Ativo: true,
        },
      });
      console.log(`✅ Período criado: ${periodo.Nome} (ID: ${periodo.IDPeriodo})`);
    } else {
      console.log(`✅ Período encontrado: ${periodo.Nome} (ID: ${periodo.IDPeriodo})`);
    }

    // 5. Criar usuário (se não existir)
    let user;
    if (!userExistente) {
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
      user = userExistente;
      console.log(`✅ Usando usuário existente: ${user.Email} (ID: ${user.IDUser})`);
    }

    // 6. Criar aluno
    console.log('\n🎓 Criando aluno...');
    const aluno = await prisma.aluno.create({
      data: {
        Nome: 'Aluno Dashboard',
        Email: 'aluno@dashboard.com',
        Semestre: 3,
        IDCurso: curso.IDCurso,
        IDUser: user.IDUser,
      },
      include: {
        curso: true,
        user: true,
      },
    });
    console.log(`✅ Aluno criado: ${aluno.Nome} (ID: ${aluno.IDAluno})`);

    // 7. Buscar disciplinas do curso
    const disciplinas = await prisma.disciplina.findMany({
      where: {
        IDCurso: curso.IDCurso,
      },
    });

    console.log(`\n📚 Disciplinas encontradas: ${disciplinas.length}`);

    // 8. Criar matrículas para todas as disciplinas
    if (disciplinas.length > 0) {
      console.log('\n📝 Criando matrículas...');
      let matriculasCriadas = 0;
      
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
          console.log(`   ⚠️ Matrícula já existe: ${disciplina.NomeDaDisciplina}`);
          continue;
        }

        const matricula = await prisma.matricula.create({
          data: {
            IDAluno: aluno.IDAluno,
            IDDisciplina: disciplina.IDDisciplina,
            IDPeriodo: periodo.IDPeriodo,
            Status: 'ENROLLED',
          },
          include: {
            disciplina: true,
            periodo: true,
          },
        });

        console.log(`   ✅ Matrícula criada: ${matricula.disciplina.NomeDaDisciplina}`);
        matriculasCriadas++;
      }

      console.log(`\n✅ Total de matrículas criadas: ${matriculasCriadas}`);
    } else {
      console.log('⚠️ Nenhuma disciplina encontrada para o curso. Matrículas não foram criadas.');
    }

    // 9. Resumo final
    const alunoFinal = await prisma.aluno.findUnique({
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

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALUNO CRIADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`\n📋 Resumo:`);
    console.log(`   Nome: ${alunoFinal?.Nome}`);
    console.log(`   Email: ${alunoFinal?.Email}`);
    console.log(`   ID Aluno: ${alunoFinal?.IDAluno}`);
    console.log(`   ID User: ${alunoFinal?.IDUser}`);
    console.log(`   Curso: ${alunoFinal?.curso.NomeDoCurso}`);
    console.log(`   Matrículas: ${alunoFinal?.matriculas.length || 0}`);
    
    if (alunoFinal && alunoFinal.matriculas.length > 0) {
      console.log(`\n📚 Disciplinas matriculadas:`);
      alunoFinal.matriculas.forEach((mat, idx) => {
        console.log(`   ${idx + 1}. ${mat.disciplina.NomeDaDisciplina} (${mat.periodo.Nome})`);
      });
    }

    console.log(`\n🔑 Credenciais de acesso:`);
    console.log(`   Email: aluno@dashboard.com`);
    console.log(`   Senha: 123456`);

    return alunoFinal;

  } catch (error: any) {
    console.error('❌ Erro ao criar aluno:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
if (require.main === module) {
  createAlunoDashboard()
    .then(() => {
      console.log('\n🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro ao executar script:', error);
      process.exit(1);
    });
}

export { createAlunoDashboard };

