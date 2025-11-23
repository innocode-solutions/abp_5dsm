import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { notificarNovaNota, notificarProfessorBaixoDesempenho } from '../service/notificacaoService';

export class NotaController {
  // GET /notas/matricula/:matriculaId - Buscar todas as notas de uma matrícula
  static async getByMatricula(req: Request, res: Response) {
    try {
      const { matriculaId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se a matrícula existe e se o usuário tem acesso
      const matricula = await prisma.matricula.findUnique({
        where: { IDMatricula: matriculaId },
        include: {
          aluno: {
            include: {
              user: true
            }
          }
        }
      });

      if (!matricula) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }

      // Verificar permissões: aluno só pode ver suas próprias notas, professor/admin pode ver todas
      const user = await prisma.user.findUnique({
        where: { IDUser: userId },
        select: { Role: true }
      });

      if (user?.Role === 'STUDENT' && matricula.aluno.IDUser !== userId) {
        return res.status(403).json({ error: 'Acesso negado. Você só pode ver suas próprias notas.' });
      }

      // Buscar todas as notas da matrícula
      const notas = await prisma.nota.findMany({
        where: { IDMatricula: matriculaId },
        orderBy: { DataAvaliacao: 'desc' },
        include: {
          matricula: {
            include: {
              disciplina: {
                select: {
                  NomeDaDisciplina: true
                }
              },
              aluno: {
                select: {
                  Nome: true
                }
              }
            }
          }
        }
      });

      res.json(notas);
    } catch (error) {
      console.error('Erro ao buscar notas da matrícula');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GET /notas/:id - Buscar uma nota específica
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const nota = await prisma.nota.findUnique({
        where: { IDNota: id },
        include: {
          matricula: {
            include: {
              aluno: {
                include: {
                  user: true
                }
              },
              disciplina: {
                select: {
                  NomeDaDisciplina: true
                }
              }
            }
          }
        }
      });

      if (!nota) {
        return res.status(404).json({ error: 'Nota não encontrada' });
      }

      // Verificar permissões
      const user = await prisma.user.findUnique({
        where: { IDUser: userId },
        select: { Role: true }
      });

      if (user?.Role === 'STUDENT' && nota.matricula.aluno.IDUser !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json(nota);
    } catch (error) {
      console.error('Erro ao buscar nota');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // POST /notas - Criar uma nova nota
  static async create(req: Request, res: Response) {
    try {
      const { IDMatricula, Valor, Tipo, DataAvaliacao, Observacoes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Validações
      if (!IDMatricula || Valor === undefined || Valor === null) {
        return res.status(400).json({ 
          error: 'IDMatricula e Valor são obrigatórios' 
        });
      }

      if (Valor < 0 || Valor > 100) {
        return res.status(400).json({ 
          error: 'Valor da nota deve estar entre 0 e 100' 
        });
      }

      // Verificar se a matrícula existe
      const matricula = await prisma.matricula.findUnique({
        where: { IDMatricula },
        include: {
          disciplina: true
        }
      });

      if (!matricula) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }

      // Verificar permissões: apenas professores e admins podem criar notas
      const user = await prisma.user.findUnique({
        where: { IDUser: userId },
        select: { Role: true }
      });

      if (user?.Role !== 'TEACHER' && user?.Role !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Apenas professores e administradores podem criar notas' 
        });
      }

      // Criar a nota
      const nota = await prisma.nota.create({
        data: {
          IDMatricula,
          Valor: Number(Valor),
          Tipo: Tipo || null,
          DataAvaliacao: DataAvaliacao ? new Date(DataAvaliacao) : new Date(),
          Observacoes: Observacoes || null
        },
        include: {
          matricula: {
            include: {
              disciplina: {
                select: {
                  IDDisciplina: true,
                  NomeDaDisciplina: true
                }
              },
              aluno: {
                select: {
                  IDAluno: true,
                  Nome: true,
                  Email: true,
                  IDUser: true
                }
              }
            }
          }
        }
      });

      // Calcular e atualizar a média na matrícula (opcional)
      await NotaController.updateMatriculaAverage(IDMatricula);

      // Criar notificação para o aluno
      try {
        await notificarNovaNota(
          nota.matricula.aluno.IDUser,
          nota.matricula.disciplina.NomeDaDisciplina,
          nota.Tipo || 'Avaliação',
          nota.Valor,
          IDMatricula
        );
      } catch (notifError) {
        console.error('⚠️ Erro ao criar notificação de nota:', notifError);
        // Não falhar a criação da nota se houver erro ao criar notificação
      }

      // Notificar professores se a nota for baixa (< 6.0)
      if (nota.Valor < 6.0) {
        try {
          await notificarProfessorBaixoDesempenho(
            nota.matricula.disciplina.IDDisciplina,
            nota.matricula.aluno.Nome,
            nota.matricula.disciplina.NomeDaDisciplina,
            nota.Valor,
            IDMatricula
          );
        } catch (notifError) {
          console.error('⚠️ Erro ao notificar professores sobre nota baixa:', notifError);
        }
      }

      res.status(201).json(nota);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          return res.status(400).json({ error: 'Matrícula inválida' });
        }
      }
      console.error('Erro ao criar nota');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // PUT /notas/:id - Atualizar uma nota
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { Valor, Tipo, DataAvaliacao, Observacoes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se a nota existe
      const notaExistente = await prisma.nota.findUnique({
        where: { IDNota: id },
        include: {
          matricula: {
            include: {
              aluno: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!notaExistente) {
        return res.status(404).json({ error: 'Nota não encontrada' });
      }

      // Verificar permissões
      const user = await prisma.user.findUnique({
        where: { IDUser: userId },
        select: { Role: true }
      });

      if (user?.Role !== 'TEACHER' && user?.Role !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Apenas professores e administradores podem atualizar notas' 
        });
      }

      // Validação do valor
      if (Valor !== undefined && (Valor < 0 || Valor > 100)) {
        return res.status(400).json({ 
          error: 'Valor da nota deve estar entre 0 e 100' 
        });
      }

      // Atualizar a nota
      const nota = await prisma.nota.update({
        where: { IDNota: id },
        data: {
          ...(Valor !== undefined && { Valor: Number(Valor) }),
          ...(Tipo !== undefined && { Tipo: Tipo || null }),
          ...(DataAvaliacao !== undefined && { DataAvaliacao: new Date(DataAvaliacao) }),
          ...(Observacoes !== undefined && { Observacoes: Observacoes || null })
        },
        include: {
          matricula: {
            include: {
              disciplina: {
                select: {
                  NomeDaDisciplina: true
                }
              },
              aluno: {
                select: {
                  Nome: true,
                  Email: true
                }
              }
            }
          }
        }
      });

      // Recalcular média
      await NotaController.updateMatriculaAverage(nota.IDMatricula);

      res.json(nota);
    } catch (error) {
      console.error('Erro ao atualizar nota');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // DELETE /notas/:id - Deletar uma nota
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se a nota existe
      const nota = await prisma.nota.findUnique({
        where: { IDNota: id },
        include: {
          matricula: {
            include: {
              aluno: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!nota) {
        return res.status(404).json({ error: 'Nota não encontrada' });
      }

      // Verificar permissões
      const user = await prisma.user.findUnique({
        where: { IDUser: userId },
        select: { Role: true }
      });

      if (user?.Role !== 'TEACHER' && user?.Role !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Apenas professores e administradores podem deletar notas' 
        });
      }

      const IDMatricula = nota.IDMatricula;

      // Deletar a nota
      await prisma.nota.delete({
        where: { IDNota: id }
      });

      // Recalcular média
      await NotaController.updateMatriculaAverage(IDMatricula);

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar nota');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GET /notas/aluno/:alunoId - Buscar todas as notas de um aluno
  static async getByAluno(req: Request, res: Response) {
    try {
      const { alunoId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o aluno existe
      const aluno = await prisma.aluno.findUnique({
        where: { IDAluno: alunoId },
        include: {
          user: true
        }
      });

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      // Verificar permissões
      const user = await prisma.user.findUnique({
        where: { IDUser: userId },
        select: { Role: true }
      });

      if (user?.Role === 'STUDENT' && aluno.IDUser !== userId) {
        return res.status(403).json({ 
          error: 'Acesso negado. Você só pode ver suas próprias notas.' 
        });
      }

      // Buscar todas as matrículas do aluno e suas notas
      const matriculas = await prisma.matricula.findMany({
        where: { IDAluno: alunoId },
        include: {
          disciplina: {
            select: {
              NomeDaDisciplina: true
            }
          },
          notas: {
            orderBy: { DataAvaliacao: 'desc' }
          },
          periodo: {
            select: {
              Nome: true
            }
          }
        }
      });

      res.json(matriculas);
    } catch (error) {
      console.error('Erro ao buscar notas do aluno');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Função auxiliar para calcular e atualizar a média na matrícula
  private static async updateMatriculaAverage(matriculaId: string) {
    try {
      const notas = await prisma.nota.findMany({
        where: { IDMatricula: matriculaId },
        select: { Valor: true }
      });

      if (notas.length === 0) {
        // Se não houver notas, definir como null
        await prisma.matricula.update({
          where: { IDMatricula: matriculaId },
          data: { Nota: null }
        });
        return;
      }

      // Calcular média
      const soma = notas.reduce((acc, nota) => acc + nota.Valor, 0);
      const media = soma / notas.length;

      // Atualizar a média na matrícula
      await prisma.matricula.update({
        where: { IDMatricula: matriculaId },
        data: { Nota: media }
      });
    } catch (error) {
      console.error('Erro ao atualizar média da matrícula');
      // Não lançar erro para não quebrar o fluxo principal
    }
  }
}

