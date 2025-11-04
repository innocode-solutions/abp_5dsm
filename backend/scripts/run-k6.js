#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.load-test') });
const { execSync } = require('child_process');

const API_URL = process.env.API_URL || 'http://localhost:8080';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO: ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos no .env.load-test');
  console.error('💡 Dica: Copie o arquivo .env.load-test.example para .env.load-test e preencha as credenciais');
  process.exit(1);
}

const command = `k6 run tests/k6-load-test.js -e API_URL=${API_URL} -e ADMIN_EMAIL=${ADMIN_EMAIL} -e ADMIN_PASSWORD=${ADMIN_PASSWORD}`;

console.log('🚀 Executando K6 com configurações do .env.load-test...');
console.log(`📍 API_URL: ${API_URL}`);
console.log(`👤 ADMIN_EMAIL: ${ADMIN_EMAIL}`);
console.log('');

try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Erro ao executar K6:', error.message);
  process.exit(1);
}