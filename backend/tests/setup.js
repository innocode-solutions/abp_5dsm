// tests/setup.js

// Configurações globais de ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://postgres:******@localhost:5432/test_db';

// Limpar console para testes mais limpos
// Isso evita que seu 'console.log()' do servidor polua a saída do Jest
global.console = {
 ...console,
 log: jest.fn(),
 debug: jest.fn(),
 info: jest.fn(),
 warn: jest.fn(),
 error: jest.fn(),
};

// Hooks globais (se necessários)
beforeAll(async () => {
 // Configurações globais antes de todos os testes
});

afterAll(async () => {
 // Limpeza após todos os testes
});