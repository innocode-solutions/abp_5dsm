/**
 * Script para adicionar notas ao banco de dados para o aluno
 * identificado pelo email aluno@dashboard.com em suas respectivas matérias
 */

import { prisma } from '../config/database';

interface NotaData {
  Tipo: string;
  Valor: number;
  DataAvaliacao: Date;
  Observacoes?: string;
}

async function addNotasJoaoSilva() {
  try {
    console.log('🔍 Buscando aluno pelo email aluno@dashboard.com...');
    
    // Buscar o aluno pelo email
    const aluno = await prisma.aluno.findUnique({
      where: {
        Email: 'aluno@dashboard.com',
      },
      include: {
        matriculas: {
          include: {
            disciplina: true,
            periodo: true,
          },
        },
      },
    });

    if (!aluno) {
      console.error('❌ Aluno com email aluno@dashboard.com não encontrado no banco de dados.');
      console.log('💡 Verifique se o aluno existe ou crie-o primeiro.');
      return;
    }

    console.log(`✅ Aluno encontrado: ${aluno.Nome} (ID: ${aluno.IDAluno})`);
    console.log(`📚 Matrículas encontradas: ${aluno.matriculas.length}`);

    if (aluno.matriculas.length === 0) {
      console.error('❌ O aluno não possui matrículas. Crie matrículas primeiro.');
      return;
    }

    // Definir notas para cada matrícula
    const notasPorMatricula: NotaData[] = [
      { Tipo: 'P1', Valor: 75, DataAvaliacao: new Date('2024-01-15'), Observacoes: 'Prova parcial 1' },
      { Tipo: 'P2', Valor: 82, DataAvaliacao: new Date('2024-02-20'), Observacoes: 'Prova parcial 2' },
      { Tipo: 'Trabalho', Valor: 90, DataAvaliacao: new Date('2024-03-10'), Observacoes: 'Trabalho prático' },
      { Tipo: 'Atividade', Valor: 85, DataAvaliacao: new Date('2024-03-25'), Observacoes: 'Atividade em grupo' },
    ];

    let totalNotasCriadas = 0;

    // Para cada matrícula, criar notas
    for (const matricula of aluno.matriculas) {
      console.log(`\n📖 Processando matrícula: ${matricula.disciplina.NomeDaDisciplina}`);
      console.log(`   Período: ${matricula.periodo.Nome}`);
      console.log(`   ID Matrícula: ${matricula.IDMatricula}`);

      // Verificar se já existem notas para esta matrícula
      const notasExistentes = await prisma.nota.count({
        where: { IDMatricula: matricula.IDMatricula },
      });

      if (notasExistentes > 0) {
        console.log(`   ⚠️  Já existem ${notasExistentes} nota(s) para esta matrícula.`);
        console.log(`   💡 Deseja adicionar mais notas? (pulando por enquanto...)`);
        // Se quiser adicionar mesmo assim, descomente o código abaixo
        // continue;
      }

      // Criar notas para esta matrícula
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

          console.log(`   ✅ Nota criada: ${notaData.Tipo} - ${notaData.Valor} pontos`);
          totalNotasCriadas++;

          // Atualizar a média da matrícula
          await updateMatriculaAverage(matricula.IDMatricula);
        } catch (error: any) {
          console.error(`   ❌ Erro ao criar nota ${notaData.Tipo}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`📊 Total de notas criadas: ${totalNotasCriadas}`);
    console.log(`📚 Matrículas processadas: ${aluno.matriculas.length}`);

  } catch (error: any) {
    console.error('❌ Erro ao adicionar notas:', error);
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

    console.log(`   📊 Média atualizada: ${media?.toFixed(2) || 'N/A'}`);
  } catch (error: any) {
    console.error(`   ⚠️  Erro ao atualizar média:`, error.message);
  }
}

// Executar o script
if (require.main === module) {
  addNotasJoaoSilva()
    .then(() => {
      console.log('\n🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro ao executar script:', error);
      process.exit(1);
    });
}

export { addNotasJoaoSilva };

