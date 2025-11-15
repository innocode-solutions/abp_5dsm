#!/usr/bin/env node

/**
 * Script de teste para validar configuração SMTP
 * 
 * Uso: node test-smtp.js
 * 
 * Este script testa se as variáveis SMTP estão configuradas corretamente
 * e se é possível conectar ao servidor de e-mail.
 */

require('dotenv').config()
const nodemailer = require('nodemailer')

async function testSMTP() {
  console.log('🧪 Testando configuração SMTP...\n')

  // Verificar variáveis de ambiente
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
  const missingVars = requiredVars.filter(v => !process.env[v])

  if (missingVars.length > 0) {
    console.error(`❌ Variáveis de ambiente faltando: ${missingVars.join(', ')}`)
    console.error('   Configure-as no arquivo .env')
    process.exit(1)
  }

  console.log('✅ Variáveis de ambiente configuradas:')
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`)
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT}`)
  console.log(`   SMTP_USER: ${process.env.SMTP_USER}`)
  console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE || 'false'}`)
  console.log()

  // Criar transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  // Testar conexão
  console.log('🔗 Conectando ao servidor SMTP...')
  try {
    const verified = await transporter.verify()
    if (verified) {
      console.log('✅ Conexão SMTP estabelecida com sucesso!\n')
      console.log('📧 Próximos passos:')
      console.log('   1. Inicie o backend: cd backend && npm run dev')
      console.log('   2. Teste o fluxo de recuperação de senha')
      console.log('   3. Verifique se o e-mail é recebido\n')
    } else {
      console.error('❌ Falha ao verificar conexão SMTP')
      process.exit(1)
    }
  } catch (error) {
    console.error(`❌ Erro ao conectar: ${error.message}`)
    console.error('\n💡 Troubleshooting:')
    console.error('   - Verifique se as credenciais estão corretas')
    console.error('   - Se usar Gmail, certifique-se de usar App Password')
    console.error('   - Verifique SMTP_HOST e SMTP_PORT')
    console.error('   - Seu firewall pode estar bloqueando a porta')
    process.exit(1)
  }
}

testSMTP()
