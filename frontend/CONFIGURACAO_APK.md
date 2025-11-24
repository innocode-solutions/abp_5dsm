# 📱 Configuração do APK - Persistência de Dados e Atualizações

## ✅ Configurações Aplicadas

### 1. Desabilitar Atualizações OTA (Over-The-Air)

As atualizações automáticas já estão desabilitadas no `app.json`:

```json
"updates": {
  "enabled": false
}
```

**O que isso significa:**
- O APK não fará atualizações automáticas
- Qualquer mudança no código requer um novo build do APK
- O usuário precisa instalar manualmente uma nova versão

### 2. Persistência de Dados no Banco

Os dados do aluno são salvos no banco de dados através do backend:

**Fluxo de salvamento:**
1. Frontend (`StudentHabitScreen.tsx`) → Coleta dados do formulário
2. `HabitService.submitHabits()` → Envia para o backend via API
3. Backend (`alunoHabitoController.ts`) → Salva no banco PostgreSQL
4. Dados persistidos na tabela `aluno_habitos`

**Endpoint usado:**
- `POST /api/aluno-habitos` - Cria ou atualiza hábitos do aluno

**Campos salvos:**
- Campos básicos: `horasEstudo`, `sono`, `motivacao`, `frequencia`
- Campos de evasão: `raisedhands`, `VisITedResources`, etc.
- Campos de desempenho: `Distance_from_Home`, `Gender`, etc.

## 🔍 Verificações

### Verificar se os dados estão sendo salvos:

1. **No Backend:**
   - Verifique os logs do servidor ao salvar
   - Verifique se há erros no console

2. **No Banco de Dados:**
   ```sql
   SELECT * FROM aluno_habitos WHERE "IDAluno" = 'id-do-aluno';
   ```

3. **No Frontend:**
   - Verifique se a mensagem de sucesso aparece após salvar
   - Verifique se os dados são recarregados após salvar

## 🛠️ Troubleshooting

### Problema: Dados não estão sendo salvos

**Possíveis causas:**
1. Erro de autenticação - Token JWT inválido
2. Aluno não encontrado - IDAluno não existe
3. Erro de validação - Dados não passam na validação do Zod
4. Erro de conexão - Backend não está acessível

**Solução:**
- Verifique os logs do backend
- Verifique se o token JWT está válido
- Verifique se o aluno existe no banco
- Verifique a conexão com o backend

### Problema: APK ainda faz atualizações

**Solução:**
- Certifique-se de que `"updates": { "enabled": false }` está no `app.json`
- Faça um novo build do APK após a alteração
- O APK antigo pode ter a configuração antiga

## 📝 Notas Importantes

1. **Build do APK:**
   - Após desabilitar atualizações, faça um novo build
   - Use: `eas build --platform android --profile production`

2. **Versionamento:**
   - Incremente `versionCode` no `app.json` para cada novo build
   - Isso garante que o Android reconheça como uma nova versão

3. **Dados do Aluno:**
   - Os dados são salvos automaticamente ao clicar em "Salvar"
   - Não há cache local - tudo vai direto para o banco
   - Os dados são atualizados (não duplicados) se já existirem

