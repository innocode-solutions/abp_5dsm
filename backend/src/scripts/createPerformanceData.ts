/**
 * Script para criar dados de desempenho e feedback para um aluno
 * 
 * Este script cria:
 * 1. Matrículas em disciplinas (se não existirem)
 * 2. Notas para as matrículas
 * 3. Predições de desempenho e evasão
 * 4. Os feedbacks são gerados automaticamente a partir das predições
 * 
 * RELAÇÕES DAS TABELAS:
 * User (1) -> (1) Aluno (via IDUser)
 * Aluno (1) -> (N) Matricula
 * Matricula (1) -> (N) Nota
 * Matricula (1) -> (N) Prediction
 * Prediction -> gera Feedback automaticamente
 */

import { prisma } from '../config/database';
import { callMLService, savePrediction } from '../service/predictionService';
import { TipoPredicao } from '@prisma/client';

interface PerformanceData {
  email: string;
  disciplinas: {
    nome: string;
    codigo?: string;
    periodo: string; // Nome do período letivo
    notas: {
      tipo: string;
      valor: number;
      dataAvaliacao: Date;
      observacoes?: string;
    }[];
  }[];
}

/**
 * Cria dados completos de desempenho para um aluno
 */
export async function createPerformanceData(data: PerformanceData) {
  try {
    console.log(`🔍 Buscando aluno com email: ${data.email}...`);

    // 1. Buscar o aluno pelo email
    const aluno = await prisma.aluno.findUnique({
      where: { Email: data.email },
      include: {
        curso: true,
        matriculas: {
          include: {
            disciplina: true,
            periodo: true,
            notas: true,
            predictions: true,
          },
        },
      },
    });

    if (!aluno) {
      throw new Error(`Aluno com email ${data.email} não encontrado`);
    }

    console.log(`✅ Aluno encontrado: ${aluno.Nome} (ID: ${aluno.IDAluno})`);

    // 2. Processar cada disciplina
    for (const disciplinaData of data.disciplinas) {
      console.log(`\n📚 Processando disciplina: ${disciplinaData.nome}`);

      // 2.1. Buscar ou criar a disciplina
      let disciplina = await prisma.disciplina.findFirst({
        where: {
          IDCurso: aluno.IDCurso,
          NomeDaDisciplina: { equals: disciplinaData.nome, mode: 'insensitive' },
        },
      });

      if (!disciplina) {
        console.log(`   ➕ Criando disciplina: ${disciplinaData.nome}`);
        disciplina = await prisma.disciplina.create({
          data: {
            IDCurso: aluno.IDCurso,
            NomeDaDisciplina: disciplinaData.nome,
            CodigoDaDisciplina: disciplinaData.codigo,
            Ativa: true,
          },
        });
      }

      // 2.2. Buscar ou criar o período letivo
      let periodo = await prisma.periodoLetivo.findFirst({
        where: {
          Nome: { equals: disciplinaData.periodo, mode: 'insensitive' },
        },
      });

      if (!periodo) {
        console.log(`   ➕ Criando período letivo: ${disciplinaData.periodo}`);
        const hoje = new Date();
        periodo = await prisma.periodoLetivo.create({
          data: {
            Nome: disciplinaData.periodo,
            DataInicio: hoje,
            DataFim: new Date(hoje.getFullYear(), hoje.getMonth() + 6), // 6 meses
            Ativo: true,
          },
        });
      }

      // 2.3. Buscar ou criar a matrícula
      let matricula = await prisma.matricula.findFirst({
        where: {
          IDAluno: aluno.IDAluno,
          IDDisciplina: disciplina.IDDisciplina,
          IDPeriodo: periodo.IDPeriodo,
        },
        include: {
          notas: true,
          predictions: true,
        },
      });

      if (!matricula) {
        console.log(`   ➕ Criando matrícula para ${disciplinaData.nome}`);
        matricula = await prisma.matricula.create({
          data: {
            IDAluno: aluno.IDAluno,
            IDDisciplina: disciplina.IDDisciplina,
            IDPeriodo: periodo.IDPeriodo,
            Status: 'ENROLLED',
          },
          include: {
            notas: true,
            predictions: true,
          },
        });
      }

      // 2.4. Criar notas (se não existirem)
      if (matricula.notas.length === 0 && disciplinaData.notas.length > 0) {
        console.log(`   📝 Criando ${disciplinaData.notas.length} nota(s)...`);
        for (const notaData of disciplinaData.notas) {
          await prisma.nota.create({
            data: {
              IDMatricula: matricula.IDMatricula,
              Valor: notaData.valor,
              Tipo: notaData.tipo,
              DataAvaliacao: notaData.dataAvaliacao,
              Observacoes: notaData.observacoes,
            },
          });
          console.log(`      ✅ Nota criada: ${notaData.tipo} - ${notaData.valor}`);
        }

        // Atualizar média da matrícula
        await updateMatriculaAverage(matricula.IDMatricula);
      }

      // 2.5. Buscar hábitos do aluno (necessário para predições)
      const habito = await prisma.alunoHabito.findFirst({
        where: { IDAluno: aluno.IDAluno },
      });

      if (!habito) {
        console.log(`   ⚠️  Aluno não possui hábitos cadastrados. Pulando predições...`);
        console.log(`   💡 Execute o script de criação de hábitos primeiro ou preencha os dados na tela.`);
        continue;
      }

      // 2.6. Criar predição de DESEMPENHO (se não existir)
      const predicaoDesempenho = matricula.predictions.find(
        (p) => p.TipoPredicao === 'DESEMPENHO'
      );

      if (!predicaoDesempenho) {
        console.log(`   🤖 Criando predição de DESEMPENHO...`);
        try {
          // Mapear dados de hábitos para formato do ML
          const { mapToPerformanceData } = await import('../service/habitoMapperService');
          const mlData = mapToPerformanceData(habito);

          const mlResponse = await callMLService('DESEMPENHO', mlData);
          await savePrediction(
            matricula.IDMatricula,
            TipoPredicao.DESEMPENHO,
            mlResponse,
            mlData
          );
          console.log(`      ✅ Predição de desempenho criada: ${mlResponse.prediction}`);
        } catch (error: any) {
          console.error(`      ❌ Erro ao criar predição de desempenho:`, error.message);
        }
      } else {
        console.log(`   ℹ️  Predição de DESEMPENHO já existe`);
      }

      // 2.7. Criar predição de EVASÃO (se não existir)
      const predicaoEvacao = matricula.predictions.find(
        (p) => p.TipoPredicao === 'EVASAO'
      );

      if (!predicaoEvacao) {
        console.log(`   🤖 Criando predição de EVASÃO...`);
        try {
          // Verificar se há dados completos de evasão
          const { hasCompleteDropoutData, mapToDropoutData } = await import(
            '../service/habitoMapperService'
          );

          if (!hasCompleteDropoutData(habito)) {
            console.log(`      ⚠️  Dados de evasão incompletos. Pulando predição de evasão.`);
            continue;
          }

          const mlData = mapToDropoutData(habito);
          const mlResponse = await callMLService('EVASAO', mlData);
          await savePrediction(
            matricula.IDMatricula,
            TipoPredicao.EVASAO,
            mlResponse,
            mlData
          );
          console.log(`      ✅ Predição de evasão criada: ${mlResponse.prediction}`);
        } catch (error: any) {
          console.error(`      ❌ Erro ao criar predição de evasão:`, error.message);
        }
      } else {
        console.log(`   ℹ️  Predição de EVASÃO já existe`);
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`📊 Dados de desempenho criados para: ${aluno.Nome}`);
    console.log(`\n💡 Os feedbacks serão gerados automaticamente ao acessar:`);
    console.log(`   - GET /feedbacks/me (para o aluno)`);
    console.log(`   - GET /feedbacks/student/:studentId (para professores)`);

  } catch (error: any) {
    console.error('❌ Erro ao criar dados de desempenho:', error);
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

    if (media !== null) {
      await prisma.matricula.update({
        where: { IDMatricula: matriculaId },
        data: { Nota: media },
      });
    }
  } catch (error: any) {
    console.error(`   ⚠️  Erro ao atualizar média:`, error.message);
  }
}

/**
 * Exemplo de uso: Criar dados de desempenho para aluno@dashboard.com
 */
async function exemploUso() {
  const hoje = new Date();
  const umMesAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
  const doisMesesAtras = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000);

  await createPerformanceData({
    email: 'aluno@dashboard.com',
    disciplinas: [
      {
        nome: 'Programação Web',
        codigo: 'PW001',
        periodo: '2024.1',
        notas: [
          { tipo: 'P1', valor: 75, dataAvaliacao: doisMesesAtras, observacoes: 'Prova parcial 1' },
          { tipo: 'P2', valor: 82, dataAvaliacao: umMesAtras, observacoes: 'Prova parcial 2' },
          { tipo: 'Trabalho', valor: 90, dataAvaliacao: hoje, observacoes: 'Trabalho prático' },
        ],
      },
      {
        nome: 'Banco de Dados',
        codigo: 'BD001',
        periodo: '2024.1',
        notas: [
          { tipo: 'P1', valor: 70, dataAvaliacao: doisMesesAtras, observacoes: 'Prova parcial 1' },
          { tipo: 'P2', valor: 85, dataAvaliacao: umMesAtras, observacoes: 'Prova parcial 2' },
          { tipo: 'Atividade', valor: 88, dataAvaliacao: hoje, observacoes: 'Atividade em grupo' },
        ],
      },
      {
        nome: 'Inteligência Artificial',
        codigo: 'IA001',
        periodo: '2024.1',
        notas: [
          { tipo: 'P1', valor: 80, dataAvaliacao: doisMesesAtras, observacoes: 'Prova parcial 1' },
          { tipo: 'P2', valor: 78, dataAvaliacao: umMesAtras, observacoes: 'Prova parcial 2' },
        ],
      },
    ],
  });
}

// Executar o script
if (require.main === module) {
  exemploUso()
    .then(() => {
      console.log('\n🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro ao executar script:', error);
      process.exit(1);
    });
}

