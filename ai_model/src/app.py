# =============================================================================
# ARQUIVO: src/app.py
# OBJETIVO: Ponto de entrada da API. Inicia o servidor Flask e define as rotas.
#           Utiliza a classe PredictionService para a lógica de ML.
# =============================================================================

from flask import Flask, request, jsonify
from models.preview import PredictionService # <-- Importa nossa classe

# --- CONFIGURAÇÕES E INICIALIZAÇÃO DO SERVIÇO ---
# Definimos os caminhos para os nossos artefatos
PREPROCESSOR_PATH = './pipelines/perf_preprocess.pkl'
LOGREG_PATH = './pipelines/perf_logreg_model.pkl'
RF_PATH = './pipelines/perf_rf_model.pkl'
DATA_PATH = './datasets/StudentPerformanceFactors.csv'

# Criamos uma instância ÚNICA do nosso serviço.
# Isso garante que os modelos sejam carregados apenas uma vez.
try:
    prediction_service = PredictionService(PREPROCESSOR_PATH, LOGREG_PATH, RF_PATH, DATA_PATH)
except Exception as e:
    print(f"Não foi possível iniciar o serviço. Erro: {e}")
    prediction_service = None

# Cria a aplicação Flask
app = Flask(__name__)

# --- DEFINIÇÃO DA ROTA DA API ---
@app.route('/predict', methods=['POST'])
def predict():
    """
    Rota principal da API. Recebe os dados do aluno e retorna o relatório.
    """
    if not prediction_service:
        return jsonify({"error": "Serviço não está disponível devido a um erro na inicialização."}), 503

    # Pega os dados JSON enviados na requisição
    student_data = request.get_json()

    if not student_data:
        return jsonify({"error": "Corpo da requisição está vazio ou não é um JSON válido."}), 400

    try:
        # Usa a nossa classe de serviço para gerar o relatório
        report = prediction_service.generate_report(student_data)
        return jsonify(report)
    
    except Exception as e:
        return jsonify({"error": f"Ocorreu um erro ao processar a requisição: {e}"}), 500

# --- INICIAR O SERVIDOR ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)