# API de Predição de Desempenho de Alunos

Uma API desenvolvida com **FastAPI** para prever o desempenho de alunos com base em diversos fatores socioeconômicos e de estudo. O projeto utiliza modelos de Machine Learning (Regressão Logística e Random Forest) e expõe as predições através de um endpoint RESTful.

A aplicação é totalmente containerizada com **Docker** para garantir portabilidade, consistência entre ambientes e facilidade de deploy.

## ✨ Funcionalidades

-   **Endpoint de Predição (`/predict/performance`):** Recebe dados de um aluno e retorna a probabilidade de aprovação.
-   **Validação de Dados:** Utiliza Pydantic para garantir que os dados de entrada estejam no formato correto.
-   **Explicabilidade (XAI):** Integra a biblioteca SHAP para explicar quais fatores mais influenciaram cada predição.
-   **Documentação Automática:** Gera documentação interativa (Swagger UI) automaticamente, disponível em `/docs`.
-   **Containerização:** Pronta para ser executada em qualquer ambiente com Docker.

## 📋 Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados na sua máquina:

-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine no Linux)
-   [Python 3.10+](https://www.python.org/downloads/) (necessário para a execução local)
-   Um cliente de API como [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/) (opcional, para testes)

## 📁 Estrutura do Projeto

```text
/ai_model/
├── .gitignore
├── app.py
├── Dockerfile
├── README.md
├── requirements.txt
└── src/
    ├── __init__.py
    ├── datasets/
    │   ├── __init__.py
    │   ├── StudentPerformanceFactors.csv
    │   ├── xAPI-dropout.csv
    │   └── xAPI-Edu-Data.csv
    ├── models/
    │   ├── __init__.py
    │   ├── analyse_feature.py
    │   ├── compareModels.py
    │   ├── explicability.py
    │   ├── preview.py
    │   ├── trainingDropoutModel.py
    │   ├── trainingLinearRegression.py
    │   ├── trainingLogisticRegression.py
    │   ├── trainingLREvasion.py
    │   └── trainingRandomForest.py
    ├── normalized/
    │   ├── __init__.py
    │   ├── datasetEvasionProcess.py
    │   └── datasetProcessorStudentPer.py
    └── pipelines/
        ├── dropout_logreg_model.pkl
        ├── dropout_preprocess.pkl
        ├── perf_logreg_model.pkl
        ├── perf_preprocess.pkl
        ├── perf_reglin_model.pkl
        └── perf_rf_model.pkl
```

## 🚀 Como Executar

Existem duas maneiras de executar a aplicação: utilizando Docker (recomendado) ou em um ambiente Python local.

### Método 1: Usando Docker (Recomendado)

Esta é a forma mais simples e garantida de executar o projeto, pois todas as dependências são gerenciadas dentro do container.

1.  **Clone o repositório** (se aplicável) e navegue até a pasta raiz do projeto.

2.  **Construa a imagem Docker:**
    Abra o terminal na pasta raiz (onde o `Dockerfile` está localizado) e execute o comando:
    ```bash
    docker build -t api-predicao-alunos .
    ```

3.  **Execute o container:**
    Após a imagem ser construída com sucesso, inicie um container a partir dela:
    ```bash
    docker run -p 5000:5000 --name servico-api api-predicao-alunos
    ```
    * A flag `-p 5000:5000` mapeia a porta do container para a sua máquina local.
    * Para rodar em segundo plano (detached mode), adicione a flag `-d`: `docker run -d -p 5000:5000 ...`

A API estará disponível em `http://localhost:5000`.

### Método 2: Ambiente Python Local (Alternativo)

1.  **Crie e ative um ambiente virtual:**
    ```bash
    # Cria o ambiente
    python -m venv venv

    # Ativa no Windows
    .\venv\Scripts\activate

    # Ativa no Linux/macOS
    source venv/bin/activate
    ```

2.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Inicie o servidor Uvicorn:**
    A partir da pasta raiz do projeto, execute:
    ```bash
    uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload
    ```

A API estará disponível em `http://localhost:5000`.

## 🧪 Como Testar a API

1.  **Documentação Interativa (Swagger UI):**
    A maneira mais fácil de testar é acessar a documentação gerada automaticamente no seu navegador:
    [**http://localhost:5000/docs**](http://localhost:5000/docs)

    Lá, você pode expandir o endpoint `/predict`, clicar em "Try it out", preencher o JSON de exemplo e executar.

2.  **Usando `curl` ou um Cliente de API:**
    Envie uma requisição `POST` para o endpoint `/predict` com os dados do aluno no corpo da requisição.

    **Endpoint:** `POST /predict`
    **URL:** `http://localhost:5000/predict`

    **Exemplo de Payload (Corpo da Requisição):**
    ```json
    {
      "Hours_Studied": 15,
      "Previous_Scores": 85,
      "Sleep_Hours": 7,
      "Distance_from_Home": "Near",
      "Attendance": 95,
      "Gender": "Female",
      "Parental_Education_Level": "Bachelor's",
      "Parental_Involvement": "High",
      "School_Type": "Private",
      "Peer_Influence": "Positive",
      "Extracurricular_Activities": "Yes",
      "Learning_Disabilities": "No",
      "Internet_Access": "Yes",
      "Access_to_Resources": "Good",
      "Teacher_Quality": "Good",
      "Family_Income": "High",
      "Motivation_Level": "High",
      "Tutoring_Sessions": "No",
      "Physical_Activity": "Medium"
    }
    ```

    **Exemplo de Resposta (Sucesso `200 OK`):**
    ```json
    {
      "probability_pass": 0.925,
      "class_pass": "APROVADO",
      "score_pred": 0.925,
      "explain": [
        {
          "feature": "Previous_Scores",
          "value": 85,
          "influence": "positiva"
        },
        {
          "feature": "Hours_Studied",
          "value": 15,
          "influence": "positiva"
        },
        {
          "feature": "Parental_Involvement",
          "value": "High",
          "influence": "positiva"
        }
      ]
    }
    ```