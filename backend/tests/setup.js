// Setup para testes
const { PrismaClient } = require('@prisma/client');

// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Limpar console para testes mais limpos
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup global para testes
beforeAll(async () => {
  // Configurações globais antes de todos os testes
});

afterAll(async () => {
  // Limpeza após todos os testes
});

beforeEach(() => {
  // Setup antes de cada teste
});

afterEach(() => {
  // Limpeza após cada teste
});