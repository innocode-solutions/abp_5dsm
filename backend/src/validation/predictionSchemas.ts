import { z } from 'zod'

export const generatePredictionSchema = z.object({
  IDMatricula: z.string().min(1, 'IDMatricula é obrigatório'),
  TipoPredicao: z.enum(['EVASAO', 'DESEMPENHO']),
  dados: z.record(z.string(), z.any())
}).passthrough()


