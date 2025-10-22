import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export interface DashboardFilters {
  disciplinaId?: string;
  periodoId?: string;
  professorId?: string;
}

export interface DashboardMetrics {
  mediaNotas: number;
  percentualAprovados: number;
  percentualRiscoAltoEvasao: number;
  distribuicaoNotas: {
    aprovados: number;
    reprovados: number;
    semNota: number;
  };
  distribuicaoRiscoEvasao: {
    baixo: number;
    medio: number;
    alto: number;
    semPredicao: number;
  };
}

export interface AlunoDashboard {
  id: string;
  nome: string;
  email: string;
  semestre: number | null;
  disciplina: {
    id: string;
    nome: string;
    codigo: string | null;
  };
  periodo: {
    id: string;
    nome: string;
    dataInicio: Date;
    dataFim: Date;
  };
  nota: number | null;
  status: string;
  predicoes: {
    desempenho: {
      probabilidade: number;
      classificacao: string;
      explicacao: string | null;
      dataPredicao: Date;
    } | null;
    evasao: {
      probabilidade: number;
      classificacao: string;
      explicacao: string | null;
      dataPredicao: Date;
    } | null;
  };
}

export class DashboardService {
  /**
   * Busca dados otimizados para o dashboard do professor
   */
  static async getProfessorDashboardData(
    professorId: string, 
    filters: DashboardFilters = {}
  ): Promise<{
    matriculas: any[];
    disciplinas: any[];
    periodos: any[];
  }> {
    const whereMatriculas: Prisma.MatriculaWhereInput = {
      ...(filters.disciplinaId && { IDDisciplina: filters.disciplinaId }),
      ...(filters.periodoId && { IDPeriodo: filters.periodoId }),
      Status: { in: ['ENROLLED', 'COMPLETED'] }
    };

    // Usar Promise.all para executar consultas em paralelo
    const [matriculas, disciplinas, periodos] = await Promise.all([
      // Buscar matrículas com dados relacionados
      prisma.matricula.findMany({
        where: whereMatriculas,
        include: {
          aluno: {
            select: {
              IDAluno: true,
              Nome: true,
              Email: true,
              Semestre: true
            }
          },
          disciplina: {
            select: {
              IDDisciplina: true,
              NomeDaDisciplina: true,
              CodigoDaDisciplina: true
            }
          },
          periodo: {
            select: {
              IDPeriodo: true,
              Nome: true,
              DataInicio: true,
              DataFim: true
            }
          },
          predictions: {
            where: {
              TipoPredicao: { in: ['DESEMPENHO', 'EVASAO'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { disciplina: { NomeDaDisciplina: 'asc' } },
          { aluno: { Nome: 'asc' } }
        ]
      }),

      // Buscar disciplinas disponíveis
      prisma.disciplina.findMany({
        where: {
          matriculas: {
            some: whereMatriculas
          }
        },
        select: {
          IDDisciplina: true,
          NomeDaDisciplina: true,
          CodigoDaDisciplina: true
        },
        orderBy: { NomeDaDisciplina: 'asc' }
      }),

      // Buscar períodos disponíveis
      prisma.periodoLetivo.findMany({
        where: {
          matriculas: {
            some: whereMatriculas
          }
        },
        select: {
          IDPeriodo: true,
          Nome: true,
          DataInicio: true,
          DataFim: true,
          Ativo: true
        },
        orderBy: { DataInicio: 'desc' }
      })
    ]);

    return { matriculas, disciplinas, periodos };
  }

  /**
   * Calcula métricas agregadas de forma otimizada
   */
  static calculateMetrics(matriculas: any[]): DashboardMetrics {
    const totalAlunos = matriculas.length;
    
    if (totalAlunos === 0) {
      return {
        mediaNotas: 0,
        percentualAprovados: 0,
        percentualRiscoAltoEvasao: 0,
        distribuicaoNotas: {
          aprovados: 0,
          reprovados: 0,
          semNota: 0
        },
        distribuicaoRiscoEvasao: {
          baixo: 0,
          medio: 0,
          alto: 0,
          semPredicao: 0
        }
      };
    }

    // Processar notas
    const notasValidas = matriculas
      .filter(m => m.Nota !== null && m.Nota !== undefined)
      .map(m => m.Nota);
    
    const mediaNotas = notasValidas.length > 0 
      ? notasValidas.reduce((sum, nota) => sum + nota, 0) / notasValidas.length 
      : 0;

    // Processar aprovações
    const aprovados = notasValidas.filter(nota => nota >= 6.0).length;
    const percentualAprovados = notasValidas.length > 0 
      ? (aprovados / notasValidas.length) * 100 
      : 0;

    // Processar predições de evasão
    const predicoesEvacao = matriculas
      .map(m => m.predictions.find((p: any) => p.TipoPredicao === 'EVASAO'))
      .filter((p: any) => p !== undefined);
    
    const riscoAltoEvasao = predicoesEvacao.filter((p: any) => 
      p.Classificacao === 'alto' || p.Probabilidade >= 0.7
    ).length;
    
    const percentualRiscoAltoEvasao = predicoesEvacao.length > 0 
      ? (riscoAltoEvasao / predicoesEvacao.length) * 100 
      : 0;

    // Distribuições
    const distribuicaoNotas = {
      aprovados: aprovados,
      reprovados: notasValidas.length - aprovados,
      semNota: totalAlunos - notasValidas.length
    };

    const distribuicaoRiscoEvasao = {
      baixo: predicoesEvacao.filter((p: any) => p.Classificacao === 'baixo').length,
      medio: predicoesEvacao.filter((p: any) => p.Classificacao === 'médio').length,
      alto: riscoAltoEvasao,
      semPredicao: totalAlunos - predicoesEvacao.length
    };

    return {
      mediaNotas: Math.round(mediaNotas * 100) / 100,
      percentualAprovados: Math.round(percentualAprovados * 100) / 100,
      percentualRiscoAltoEvasao: Math.round(percentualRiscoAltoEvasao * 100) / 100,
      distribuicaoNotas,
      distribuicaoRiscoEvasao
    };
  }

  /**
   * Formata dados dos alunos para o dashboard
   */
  static formatAlunosData(matriculas: any[]): AlunoDashboard[] {
    return matriculas.map(matricula => {
      const predicaoDesempenho = matricula.predictions.find((p: any) => p.TipoPredicao === 'DESEMPENHO');
      const predicaoEvacao = matricula.predictions.find((p: any) => p.TipoPredicao === 'EVASAO');

      return {
        id: matricula.aluno.IDAluno,
        nome: matricula.aluno.Nome,
        email: matricula.aluno.Email,
        semestre: matricula.aluno.Semestre,
        disciplina: {
          id: matricula.disciplina.IDDisciplina,
          nome: matricula.disciplina.NomeDaDisciplina,
          codigo: matricula.disciplina.CodigoDaDisciplina
        },
        periodo: {
          id: matricula.periodo.IDPeriodo,
          nome: matricula.periodo.Nome,
          dataInicio: matricula.periodo.DataInicio,
          dataFim: matricula.periodo.DataFim
        },
        nota: matricula.Nota,
        status: matricula.Status,
        predicoes: {
          desempenho: predicaoDesempenho ? {
            probabilidade: predicaoDesempenho.Probabilidade,
            classificacao: predicaoDesempenho.Classificacao,
            explicacao: predicaoDesempenho.Explicacao,
            dataPredicao: predicaoDesempenho.createdAt
          } : null,
          evasao: predicaoEvacao ? {
            probabilidade: predicaoEvacao.Probabilidade,
            classificacao: predicaoEvacao.Classificacao,
            explicacao: predicaoEvacao.Explicacao,
            dataPredicao: predicaoEvacao.createdAt
          } : null
        }
      };
    });
  }

  /**
   * Busca dados mínimos para resumo rápido (otimizado para performance)
   */
  static async getProfessorDashboardResumoData(
    professorId: string,
    filters: DashboardFilters = {}
  ): Promise<{ matriculas: any[] }> {
    const whereMatriculas: Prisma.MatriculaWhereInput = {
      ...(filters.disciplinaId && { IDDisciplina: filters.disciplinaId }),
      ...(filters.periodoId && { IDPeriodo: filters.periodoId }),
      Status: { in: ['ENROLLED', 'COMPLETED'] }
    };

    const matriculas = await prisma.matricula.findMany({
      where: whereMatriculas,
      select: {
        Nota: true,
        predictions: {
          where: { TipoPredicao: 'EVASAO' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            Classificacao: true,
            Probabilidade: true
          }
        }
      }
    });

    return { matriculas };
  }
}
