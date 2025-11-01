const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestGraph() {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

  const curso = await prisma.curso.create({
    data: {
      NomeDoCurso: `QA Curso ${suffix}`,
      Descricao: 'Curso para testes E2E'
    }
  });

  const disciplina = await prisma.disciplina.create({
    data: {
      IDCurso: curso.IDCurso,
      NomeDaDisciplina: `QA Disciplina ${suffix}`,
      CodigoDaDisciplina: `QA${suffix.slice(-6)}`,
      CargaHoraria: 60,
      Ativa: true
    }
  });

  const aluno = await prisma.aluno.create({
    data: {
      Nome: `Aluno QA ${suffix}`,
      Email: `qa.aluno.${suffix}@example.com`,
      IDCurso: curso.IDCurso,
      Idade: 20,
      Semestre: 1
    }
  });

  const now = new Date();
  const daqui30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const periodo = await prisma.periodoLetivo.create({
    data: {
      Nome: `2025.1 QA ${suffix}`,
      DataInicio: now,
      DataFim: daqui30,
      Ativo: true
    }
  });

  const matricula = await prisma.matricula.create({
    data: {
      IDAluno: aluno.IDAluno,
      IDDisciplina: disciplina.IDDisciplina,
      IDPeriodo: periodo.IDPeriodo,
      Status: 'ENROLLED'
    }
  });

  return {
    cursoId: curso.IDCurso,
    disciplinaId: disciplina.IDDisciplina,
    alunoId: aluno.IDAluno,
    periodoId: periodo.IDPeriodo,
    matriculaId: matricula.IDMatricula
  };
}

async function cleanupTestGraph(ids) {
  if (!ids) return;
  try { await prisma.prediction.deleteMany({ where: { IDMatricula: ids.matriculaId } }); } catch {}
  try { await prisma.matricula.delete({ where: { IDMatricula: ids.matriculaId } }); } catch {}
  try { await prisma.aluno.delete({ where: { IDAluno: ids.alunoId } }); } catch {}
  try { await prisma.disciplina.delete({ where: { IDDisciplina: ids.disciplinaId } }); } catch {}
  try { await prisma.periodoLetivo.delete({ where: { IDPeriodo: ids.periodoId } }); } catch {}
  try { await prisma.curso.delete({ where: { IDCurso: ids.cursoId } }); } catch {}
}

module.exports = { createTestGraph, cleanupTestGraph, prisma };


