# =============================================================================
# OBJETIVO: Carregar dados brutos e um pré-processador já treinado,
#           e treinar um modelo de Regressão Linear.
# =============================================================================

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression  # <-- MODELO ALTERADO
from sklearn.metrics import mean_absolute_error, r2_score

class ModelTrainer:
    """
    Uma classe para carregar dados e um pré-processador, e então treinar,
    avaliar e salvar um modelo de Regressão Linear.
    """
    def __init__(self, preprocessor_path, random_state=42):
        self.random_state = random_state
        self.model = None
        # Carrega o pré-processador ao inicializar
        try:
            self.preprocessor = joblib.load(preprocessor_path)
            print(f"✅ Pré-processador '{preprocessor_path}' carregado com sucesso.")
        except FileNotFoundError:
            print(f"❌ Erro: Pré-processador '{preprocessor_path}' não encontrado.")
            print("➡️ Por favor, execute o script '1_criar_preprocessador.py' primeiro.")
            self.preprocessor = None

    def train(self, data):
        """
        Executa o fluxo de treinamento usando o pré-processador já carregado.
        """
        if self.preprocessor is None:
            return # Não continua se o pré-processador não foi carregado

        # 1. Dividir os dados brutos
        X = data.drop(columns='Exam_Score')
        y = data['Exam_Score']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=self.random_state)
        print(f"\n✅ Dados brutos divididos: {len(X_train)} para treino, {len(X_test)} para teste.")
        
        # 2. APLICAR o pré-processador (usando .transform)
        X_train_proc = self.preprocessor.transform(X_train)
        X_test_proc = self.preprocessor.transform(X_test)
        print("✅ Dados de treino e teste transformados com o pipeline carregado.")
        
        # 3. Treinamento do Modelo de Regressão Linear
        print("\n--- Treinando o modelo de Regressão Linear ---")
        self.model = LinearRegression()
        
        # Treina o modelo com os dados de treino já processados
        self.model.fit(X_train_proc, y_train)
        print("✅ Modelo de Regressão Linear treinado com sucesso!")
        
        # 4. Avaliar o modelo final
        self._evaluate(X_test_proc, y_test)
        
        # 5. Salvar o MODELO
        self._save_model()
        
    def _evaluate(self, X_test_proc, y_test):
        y_pred = self.model.predict(X_test_proc)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print("\n--- Relatório de Métricas (Regressão Linear) ---")
        print(f"🔹 Erro Médio Absoluto (MAE): {mae:.2f}")
        print(f"🔸 Coeficiente de Determinação (R²): {r2:.2f}")

    def _save_model(self):
        # O nome do arquivo salvo continua o mesmo para consistência com o script de previsão
        joblib.dump(self.model, '../pipelines/perf_reglin_model.pkl')
        print("\n💾 Modelo salvo com sucesso em '../pipelinesperf_reglin_model.pkl'!")

def load_data(filepath):
    try:
        df = pd.read_csv(filepath)
        print(f"✅ Dataset '{filepath}' carregado com sucesso!")
        return df
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    print("--- INICIANDO PROCESSO DE TREINAMENTO DE MODELO (Regressão Linear) ---")
    
    DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
    PREPROCESSOR_PATH = './pipelines/perf_preprocess.pkl'
    
    dataframe = load_data(DATASET_PATH)
    
    if dataframe is not None:
        trainer = ModelTrainer(preprocessor_path=PREPROCESSOR_PATH)
        trainer.train(dataframe)
        print("\n--- PROCESSO DE TREINAMENTO CONCLUÍDO ---")
