import { prisma } from '../config/database';
import { TipoNotificacao, StatusNotificacao, UserRole } from '@prisma/client';

export interface CriarNotificacaoParams {
  IDUser: string;
  Tipo: TipoNotificacao;
  Titulo: string;
  Mensagem: string;
  Link?: string;
  DadosAdicionais?: any;
}

/**
 * Cria uma nova notificação para um usuário
 */
export async function criarNotificacao(params: CriarNotificacaoParams) {
  try {
    const notificacao = await prisma.notificacao.create({
      data: {
        IDUser: params.IDUser,
        Tipo: params.Tipo,
        Titulo: params.Titulo,
        Mensagem: params.Mensagem,
        Link: params.Link || null,
        DadosAdicionais: params.DadosAdicionais || null,
        Status: StatusNotificacao.NAO_LIDA,
      },
    });

    return notificacao;
  } catch (error) {
    console.error('Erro ao criar notificação');
    throw error;
  }
}

/**
 * Cria notificação quando uma nova predição de desempenho é gerada
 */
export async function notificarNovaPredicaoDesempenho(
  IDUser: string,
  disciplina: string,
  notaPrevista: number,
  IDMatricula?: string
) {
  const classificacao = notaPrevista >= 7 ? 'Bom' : notaPrevista >= 5 ? 'Médio' : 'Baixo';
  
  return criarNotificacao({
    IDUser,
    Tipo: TipoNotificacao.DESEMPENHO,
    Titulo: `Nova Predição de Desempenho - ${disciplina}`,
    Mensagem: `Sua nota prevista em ${disciplina} é ${notaPrevista.toFixed(1)}/10 (${classificacao}).`,
    Link: IDMatricula ? `/desempenho?matricula=${IDMatricula}` : undefined,
    DadosAdicionais: {
      IDMatricula,
      disciplina,
      notaPrevista,
      classificacao,
    },
  });
}

/**
 * Cria notificação quando uma nova predição de evasão é gerada
 */
export async function notificarNovaPredicaoEvasao(
  IDUser: string,
  disciplina: string,
  risco: string,
  probabilidade: number,
  IDMatricula?: string
) {
  return criarNotificacao({
    IDUser,
    Tipo: TipoNotificacao.EVASAO,
    Titulo: `Análise de Risco de Evasão - ${disciplina}`,
    Mensagem: `Seu risco de evasão em ${disciplina} foi classificado como ${risco} (${Math.round(probabilidade * 100)}%).`,
    Link: IDMatricula ? `/evasao?matricula=${IDMatricula}` : undefined,
    DadosAdicionais: {
      IDMatricula,
      disciplina,
      risco,
      probabilidade,
    },
  });
}

/**
 * Cria notificação quando uma nova nota é lançada
 */
export async function notificarNovaNota(
  IDUser: string,
  disciplina: string,
  tipoAvaliacao: string,
  valor: number,
  IDMatricula?: string
) {
  return criarNotificacao({
    IDUser,
    Tipo: TipoNotificacao.NOTA,
    Titulo: `Nova Nota Lançada - ${disciplina}`,
    Mensagem: `Uma nova nota foi lançada em ${disciplina}: ${tipoAvaliacao} - ${valor.toFixed(1)}/10`,
    Link: IDMatricula ? `/notas?matricula=${IDMatricula}` : undefined,
    DadosAdicionais: {
      IDMatricula,
      disciplina,
      tipoAvaliacao,
      valor,
    },
  });
}

/**
 * Cria notificação de alerta do sistema
 */
export async function notificarAlerta(
  IDUser: string,
  titulo: string,
  mensagem: string,
  link?: string
) {
  return criarNotificacao({
    IDUser,
    Tipo: TipoNotificacao.ALERTA,
    Titulo: titulo,
    Mensagem: mensagem,
    Link: link,
  });
}

/**
 * Notifica professores sobre baixo desempenho de um aluno
 */
export async function notificarProfessorBaixoDesempenho(
  IDDisciplina: string,
  nomeAluno: string,
  disciplina: string,
  notaPrevista: number,
  IDMatricula?: string
) {
  try {
    // Buscar todos os professores (por enquanto, todos os professores podem ver todas as disciplinas)
    // Em um sistema mais complexo, você poderia ter uma tabela de associação professor-disciplina
    const professores = await prisma.user.findMany({
      where: {
        Role: UserRole.TEACHER,
      },
    });

    const promises = professores.map((professor) =>
      criarNotificacao({
        IDUser: professor.IDUser,
        Tipo: TipoNotificacao.ALERTA,
        Titulo: `Alerta: Baixo Desempenho - ${disciplina}`,
        Mensagem: `O aluno ${nomeAluno} está com desempenho baixo em ${disciplina} (nota prevista: ${notaPrevista.toFixed(1)}/10). Atenção necessária.`,
        Link: IDMatricula ? `/alunos/class/${IDDisciplina}?matricula=${IDMatricula}` : `/alunos/class/${IDDisciplina}`,
        DadosAdicionais: {
          IDDisciplina,
          IDMatricula,
          nomeAluno,
          disciplina,
          notaPrevista,
          tipo: 'baixo_desempenho',
        },
      })
    );

    await Promise.all(promises);
    return professores.length;
  } catch (error) {
    console.error('Erro ao notificar professores sobre baixo desempenho');
    throw error;
  }
}

/**
 * Notifica professores sobre alto risco de evasão de um aluno
 */
export async function notificarProfessorAltoRiscoEvasao(
  IDDisciplina: string,
  nomeAluno: string,
  disciplina: string,
  risco: string,
  probabilidade: number,
  IDMatricula?: string
) {
  try {
    const professores = await prisma.user.findMany({
      where: {
        Role: UserRole.TEACHER,
      },
    });

    const promises = professores.map((professor) =>
      criarNotificacao({
        IDUser: professor.IDUser,
        Tipo: TipoNotificacao.EVASAO,
        Titulo: `Alerta: Alto Risco de Evasão - ${disciplina}`,
        Mensagem: `O aluno ${nomeAluno} apresenta ${risco} risco de evasão em ${disciplina} (${Math.round(probabilidade * 100)}%). Ação imediata recomendada.`,
        Link: IDMatricula ? `/alunos/class/${IDDisciplina}?matricula=${IDMatricula}` : `/alunos/class/${IDDisciplina}`,
        DadosAdicionais: {
          IDDisciplina,
          IDMatricula,
          nomeAluno,
          disciplina,
          risco,
          probabilidade,
          tipo: 'alto_risco_evasao',
        },
      })
    );

    await Promise.all(promises);
    return professores.length;
  } catch (error) {
    console.error('Erro ao notificar professores sobre alto risco de evasão');
    throw error;
  }
}

/**
 * Notifica professores quando um aluno completa um formulário de hábitos/engajamento
 */
export async function notificarProfessorFormularioCompleto(
  IDDisciplina: string,
  nomeAluno: string,
  disciplina: string,
  tipoFormulario: 'DESEMPENHO' | 'EVASAO',
  IDMatricula?: string
) {
  try {
    const professores = await prisma.user.findMany({
      where: {
        Role: UserRole.TEACHER,
      },
    });

    const tipoTexto = tipoFormulario === 'DESEMPENHO' ? 'desempenho' : 'engajamento/evasão';
    
    const promises = professores.map((professor) =>
      criarNotificacao({
        IDUser: professor.IDUser,
        Tipo: tipoFormulario === 'DESEMPENHO' ? TipoNotificacao.DESEMPENHO : TipoNotificacao.EVASAO,
        Titulo: `Novo Formulário Preenchido - ${disciplina}`,
        Mensagem: `O aluno ${nomeAluno} completou o formulário de ${tipoTexto} para ${disciplina}. Verifique as novas predições.`,
        Link: IDMatricula ? `/alunos/class/${IDDisciplina}?matricula=${IDMatricula}` : `/alunos/class/${IDDisciplina}`,
        DadosAdicionais: {
          IDDisciplina,
          IDMatricula,
          nomeAluno,
          disciplina,
          tipoFormulario,
          tipo: 'formulario_completo',
        },
      })
    );

    await Promise.all(promises);
    return professores.length;
  } catch (error) {
    console.error('Erro ao notificar professores sobre formulário completo');
    throw error;
  }
}

/**
 * Notifica todos os admins sobre eventos importantes do sistema
 */
export async function notificarAdmins(
  titulo: string,
  mensagem: string,
  tipo: TipoNotificacao = TipoNotificacao.SISTEMA,
  link?: string,
  dadosAdicionais?: any
) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        Role: UserRole.ADMIN,
      },
    });

    const promises = admins.map((admin) =>
      criarNotificacao({
        IDUser: admin.IDUser,
        Tipo: tipo,
        Titulo: titulo,
        Mensagem: mensagem,
        Link: link,
        DadosAdicionais: dadosAdicionais,
      })
    );

    await Promise.all(promises);
    return admins.length;
  } catch (error) {
    console.error('Erro ao notificar admins');
    throw error;
  }
}

/**
 * Notifica admins sobre estatísticas importantes (ex: muitos alunos com baixo desempenho)
 */
export async function notificarAdminsEstatisticas(
  titulo: string,
  mensagem: string,
  dadosEstatisticos: any
) {
  return notificarAdmins(
    titulo,
    mensagem,
    TipoNotificacao.SISTEMA,
    '/admin/dashboard',
    dadosEstatisticos
  );
}

