# Machine Learning - Serviço Externo

## 🏗️ Arquitetura

O backend agora utiliza um **serviço de ML externo** ao invés de executar modelos Python localmente.

```
backend/
  src/
    service/
      mlService.ts          # Cliente HTTP para o serviço de ML
      predictionService.ts  # Serviço de predições que usa mlService
```

## 🔗 Configuração do Endpoint

O endpoint do serviço de ML é configurado através da variável de ambiente `ML_SERVICE_URL`:

- **Padrão (produção)**: `https://aimodel-teste-deploy.up.railway.app`
- **Desenvolvimento local**: Configure `ML_SERVICE_URL=http://localhost:5000` no seu `.env`

### Variável de Ambiente

```bash
# No Railway ou arquivo .env
ML_SERVICE_URL=https://aimodel-teste-deploy.up.railway.app
```

## ✅ Verificação

Teste se o serviço de ML está funcionando:

```bash
# Health check do ML service (via backend)
curl http://localhost:3000/health/ml

# Health check direto do serviço de ML
curl https://aimodel-teste-deploy.up.railway.app/health
```

## 📝 Notas

- O backend faz requisições HTTP para o serviço de ML externo
- O serviço de ML é um serviço separado (Flask/FastAPI) deployado no Railway
- Não é mais necessário ter Python instalado no backend
- As predições são feitas via API REST: `/predict/dropout` e `/predict/performance`


