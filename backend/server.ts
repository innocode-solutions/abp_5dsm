// server.ts
import app from './src/app';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

// ======== HTTPS CONFIGURATION ========
const basePath = process.cwd(); // garante caminho correto no Docker
const SSL_KEY_PATH = path.resolve(basePath, process.env.SSL_KEY_PATH || 'certs/server.key');
const SSL_CERT_PATH = path.resolve(basePath, process.env.SSL_CERT_PATH || 'certs/server.crt');

const useHttps = fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH);

let sslOptions: { key?: Buffer; cert?: Buffer } = {};
if (useHttps) {
 sslOptions = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH),
 };
 console.log('✅ Certificados SSL carregados com sucesso.');
} else {
 console.warn('⚠️ Certificados SSL não encontrados. O servidor rodará em HTTP apenas.');
}

// Ports
const HTTP_PORT = Number(process.env.HTTP_PORT) || 8080;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 8443;

// ======== Start HTTPS and HTTP redirect ========
if (useHttps) {
 https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
  console.log(`✅ HTTPS ativo em https://localhost:${HTTPS_PORT}`);
  console.log(`🌎 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health: https://localhost:${HTTPS_PORT}/health`);
  console.log(`🗄️ DB Health: https://localhost:${HTTPS_PORT}/health/db`);
  console.log(`📚 API: https://localhost:${HTTPS_PORT}/api`);
 });

 http.createServer((req, res) => {
  const host = req.headers.host?.replace(/:\d+$/, '');
  res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
  res.end();
 }).listen(HTTP_PORT, () => {
  console.log(`🟡 HTTP redirecionando → HTTPS na porta ${HTTP_PORT}`);
 });
} else {
 app.listen(HTTP_PORT, () => {
  console.log(`🚀 Servidor HTTP rodando em http://localhost:${HTTP_PORT}`);
 });
}