# Machine Learning - Backend Integrado

## 📁 Estrutura

```
backend/
  src/
    ml/
      models/
        dropout_predict.py      # Predição de evasão
        performance_predict.py   # Predição de desempenho
      pipelines/
        *.pkl                   # Modelos treinados
      datasets/
        *.csv                   # Datasets de treinamento
  requirements.txt              # Dependências Python
```

## 🚀 Instalação

1. Instale as dependências Python:
```bash
pip install -r requirements.txt
```

2. Certifique-se de que Python 3.x está instalado e disponível no PATH.

## ✅ Verificação

Teste se tudo está funcionando:

```bash
# Health check do ML service
curl http://localhost:3333/health/ml
```

## 📝 Notas

- Os modelos Python são executados diretamente pelo backend via `child_process`
- Não é necessário rodar um serviço Python separado
- Todos os arquivos ML estão dentro do backend para facilitar deploy


