import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PredictionController {
  /**
   * Buscar todas as predições
   */
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

  /**
   * Buscar predição por ID
   */
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

  /**
   * Criar nova predição
   */
  static async create(req: Request, res: Response) {
    try {
      const { IDMatricula, TipoPredicao, Probabilidade, Classificacao, Explicacao, DadosEntrada } = req.body;

      // Verificar se a matrícula existe
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

  /**
   * Atualizar predição
   */
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

  /**
   * Deletar predição
   */
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

  /**
   * Buscar predições por matrícula
   */
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

  /**
   * Buscar predições por tipo
   */
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
}
