/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // ⚙️ Arquivo de configuração de ambiente de teste
  setupFilesAfterEnv: ['<rootDir>/tests/setupTest.ts'],

  // ⏱️ Tempo máximo por teste
  testTimeout: 30000,

  // 🧾 Log detalhado dos testes
  verbose: true,

  // 🧹 Ignora pastas desnecessárias
  modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/coverage'],
};