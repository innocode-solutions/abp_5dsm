import { Request, Response } from 'express';
import { PrismaClient, TipoPredicao } from '@prisma/client';
import { callMLService, savePrediction, MLPredictionResponse } from '../service/predictionService';
import { emitPredictionCreated } from '../service/socketService';

const prisma = new PrismaClient();

export class PredictionController {
  static async getAll(req: Request, res: Response) {
    try {
      const predictions = await prisma.prediction.findMany({
        include: {
          matricula: {
            include: {
              aluno: true,
              disciplina: true,
              periodo: true
            }
          }
        }
      });

      res.json(predictions);
    } catch (error) {
      console.error('Erro ao buscar predições:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const prediction = await prisma.prediction.findUnique({
        where: { IDPrediction: id },
        include: {
          matricula: {
            include: {
              aluno: true,
              disciplina: true,
              periodo: true
            }
          }
        }
      });

      if (!prediction) {
        return res.status(404).json({ error: 'Predição não encontrada' });
      }

      res.json(prediction);
    } catch (error) {
      console.error('Erro ao buscar predição:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { IDMatricula, TipoPredicao, Probabilidade, Classificacao, Explicacao, DadosEntrada } = req.body;

      const matricula = await prisma.matricula.findUnique({
        where: { IDMatricula }
      });

      if (!matricula) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }

      const prediction = await prisma.prediction.create({
        data: {
          IDMatricula,
          TipoPredicao,
          Probabilidade,
          Classificacao,
          Explicacao,
          DadosEntrada
        },
        include: {
          matricula: {
            include: {
              aluno: true,
              disciplina: true,
              periodo: true
            }
          }
        }
      });

      res.status(201).json(prediction);
    } catch (error) {
      console.error('Erro ao criar predição:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async createPrediction(req: Request, res: Response) {
    try {
      const { IDMatricula, TipoPredicao, dados } = req.body;

      if (!IDMatricula || !TipoPredicao || !dados) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios: IDMatricula, TipoPredicao e dados' 
        });
      }

      if (TipoPredicao !== 'EVASAO' && TipoPredicao !== 'DESEMPENHO') {
        return res.status(400).json({ 
          error: 'TipoPredicao deve ser "EVASAO" ou "DESEMPENHO"' 
        });
      }

      const matricula = await prisma.matricula.findUnique({
        where: { IDMatricula }
      });

      if (!matricula) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }

      let mlResponse: MLPredictionResponse;

      try {
        mlResponse = await callMLService(TipoPredicao, dados);
      } catch (error: any) {
        if (error.message === 'Serviço de ML indisponível') {
          return res.status(503).json({ 
            error: 'Serviço de predição temporariamente indisponível' 
          });
        }
        if (error.message === 'Timeout ao conectar com o serviço de ML') {
          return res.status(504).json({ 
            error: 'Timeout ao processar predição' 
          });
        }
        throw error;
      }

      const prediction = await savePrediction(
        IDMatricula,
        TipoPredicao as TipoPredicao,
        mlResponse,
        dados
      );

      // Emitir evento WebSocket para atualização em tempo real
      if (prediction.matricula?.disciplina) {
        emitPredictionCreated({
          IDMatricula: prediction.IDMatricula,
          IDDisciplina: prediction.matricula.disciplina.IDDisciplina,
          TipoPredicao: prediction.TipoPredicao as 'DESEMPENHO' | 'EVASAO',
          IDPrediction: prediction.IDPrediction,
          createdAt: prediction.createdAt,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Predição gerada e salva com sucesso',
        data: {
          IDPrediction: prediction.IDPrediction,
          IDMatricula: prediction.IDMatricula,
          TipoPredicao: prediction.TipoPredicao,
          Probabilidade: prediction.Probabilidade,
          Classificacao: prediction.Classificacao,
          Explicacao: prediction.Explicacao,
          createdAt: prediction.createdAt
        }
      });
    } catch (error) {
      console.error('Erro ao criar predição com ML:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { TipoPredicao, Probabilidade, Classificacao, Explicacao, DadosEntrada } = req.body;

      const prediction = await prisma.prediction.update({
        where: { IDPrediction: id },
        data: {
          TipoPredicao,
          Probabilidade,
          Classificacao,
          Explicacao,
          DadosEntrada
        },
        include: {
          matricula: {
            include: {
              aluno: true,
              disciplina: true,
              periodo: true
            }
          }
        }
      });

      res.json(prediction);
    } catch (error) {
      console.error('Erro ao atualizar predição:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.prediction.delete({
        where: { IDPrediction: id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar predição:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getByMatricula(req: Request, res: Response) {
    try {
      const { matriculaId } = req.params;
      
      const predictions = await prisma.prediction.findMany({
        where: { IDMatricula: matriculaId },
        include: {
          matricula: {
            include: {
              aluno: true,
              disciplina: true,
              periodo: true
            }
          }
        }
      });

      res.json(predictions);
    } catch (error) {
      console.error('Erro ao buscar predições por matrícula:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getByTipo(req: Request, res: Response) {
    try {
      const { tipo } = req.params;
      
      const predictions = await prisma.prediction.findMany({
        where: { TipoPredicao: tipo as any },
        include: {
          matricula: {
            include: {
              aluno: true,
              disciplina: true,
              periodo: true
            }
          }
        }
      });

      res.json(predictions);
    } catch (error) {
      console.error('Erro ao buscar predições por tipo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async createPredictionForStudent(req: Request, res: Response) {
    try {
      const { IDMatricula, dados } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (user.role !== 'STUDENT') {
        return res.status(403).json({ error: 'Acesso negado. Apenas alunos podem usar este endpoint.' });
      }

      if (!IDMatricula || !dados) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios: IDMatricula e dados' 
        });
      }

      // Buscar matrícula e validar ownership
      const matricula = await prisma.matricula.findUnique({
        where: { IDMatricula },
        include: {
          aluno: true,
          disciplina: true,
          periodo: true
        }
      });

      if (!matricula) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }

      // Validar se a matrícula pertence ao aluno autenticado
      // user.studentId contém o IDAluno do usuário autenticado
      if (!user.studentId) {
        return res.status(403).json({ 
          error: 'Acesso negado. Usuário não está associado a um aluno.' 
        });
      }

      if (matricula.IDAluno !== user.studentId) {
        return res.status(403).json({ 
          error: 'Acesso negado. Você só pode fazer predições para suas próprias matrículas.' 
        });
      }

      // Validar se matrícula está ativa
      if (matricula.Status !== 'ENROLLED') {
        return res.status(400).json({ 
          error: 'Matrícula não está ativa. Apenas matrículas ativas podem fazer predições.' 
        });
      }

      // Chamar serviço ML para predição de desempenho
      let mlResponse: MLPredictionResponse;

      try {
        mlResponse = await callMLService('DESEMPENHO', dados);
      } catch (error: any) {
        if (error.message === 'Serviço de ML indisponível') {
          return res.status(503).json({ 
            error: 'Serviço de predição temporariamente indisponível' 
          });
        }
        if (error.message === 'Timeout ao conectar com o serviço de ML') {
          return res.status(504).json({ 
            error: 'Timeout ao processar predição' 
          });
        }
        if (error.message.includes('Dados inválidos')) {
          return res.status(400).json({ 
            error: error.message 
          });
        }
        throw error;
      }

      // Salvar predição no banco
      const prediction = await savePrediction(
        IDMatricula,
        'DESEMPENHO' as TipoPredicao,
        mlResponse,
        dados
      );

      // Emitir evento WebSocket para atualização em tempo real
      if (prediction.matricula?.disciplina) {
        emitPredictionCreated({
          IDMatricula: prediction.IDMatricula,
          IDDisciplina: prediction.matricula.disciplina.IDDisciplina,
          TipoPredicao: 'DESEMPENHO',
          IDPrediction: prediction.IDPrediction,
          createdAt: prediction.createdAt,
        });
      }

      // Retornar resposta com predicted_score (0-100)
      res.status(201).json({
        success: true,
        message: 'Predição gerada e salva com sucesso',
        data: {
          IDPrediction: prediction.IDPrediction,
          IDMatricula: prediction.IDMatricula,
          TipoPredicao: prediction.TipoPredicao,
          predicted_score: mlResponse.predicted_score || (mlResponse.probability * 100), // 0-100
          Probabilidade: prediction.Probabilidade, // 0-1
          Classificacao: prediction.Classificacao,
          approval_status: mlResponse.approval_status || prediction.Classificacao,
          grade_category: mlResponse.grade_category || 'N/A',
          Explicacao: prediction.Explicacao,
          disciplina: {
            IDDisciplina: matricula.disciplina.IDDisciplina,
            NomeDaDisciplina: matricula.disciplina.NomeDaDisciplina,
            CodigoDaDisciplina: matricula.disciplina.CodigoDaDisciplina
          },
          periodo: {
            IDPeriodo: matricula.periodo.IDPeriodo,
            Nome: matricula.periodo.Nome
          },
          createdAt: prediction.createdAt
        }
      });
    } catch (error) {
      console.error('Erro ao criar predição para aluno:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

