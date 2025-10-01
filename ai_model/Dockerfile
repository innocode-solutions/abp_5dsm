# =================================================================
# Dockerfile para a API de Predição de Desempenho
# =================================================================

# 1. Imagem Base: Usamos uma imagem Python leve e oficial.
FROM python:3.11-slim

# 2. Define o diretório de trabalho dentro do container.
WORKDIR /app

# 3. Copia o arquivo de dependências PRIMEIRO.
#    Isso aproveita o cache do Docker: se o requirements.txt não mudar,
#    esta camada não será reconstruída, acelerando o build.
COPY requirements.txt .

# 4. Instala as dependências.
#    --no-cache-dir: não armazena o cache do pip, mantendo a imagem menor.
#    --upgrade pip: boa prática para garantir que o pip esteja atualizado.
RUN pip install --no-cache-dir --upgrade pip -r requirements.txt

# 5. Copia todo o resto do código do projeto para o diretório de trabalho no container.
#    Isso inclui as pastas `src`, `models`, `pipelines`, etc.
COPY . .

# 6. Expõe a porta que a aplicação vai usar.
#    O Uvicorn será configurado para rodar na porta 5000.
EXPOSE 5000

# 7. Comando para iniciar a aplicação quando o container for executado.
#    É importante usar "0.0.0.0" como host para que a API seja acessível
#    de fora do container.
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "5000"]