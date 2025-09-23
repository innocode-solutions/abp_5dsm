# =============================================================================
# ARQUIVO: treinamentoRandomForest.py
# OBJETIVO: Carregar dados brutos e um pré-processador JÁ TREINADO,
#           e focar apenas no treinamento e otimização do modelo de ML.
# =============================================================================

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

class ModelTrainer:
    """
    Uma classe para carregar dados e um pré-processador, e então treinar,
    avaliar e salvar um modelo de machine learning.
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
        
        # 2. APLICAR o pré-processador (usando .transform, não .fit_transform)
        X_train_proc = self.preprocessor.transform(X_train)
        X_test_proc = self.preprocessor.transform(X_test)
        print("✅ Dados de treino e teste transformados com o pipeline carregado.")
        
        # 3. Otimização e Treinamento do Modelo
        print("\n--- Iniciando busca pelos melhores hiperparâmetros ---")
        param_grid = {
            'n_estimators': [50, 100], 'max_depth': [None, 10, 20], 'min_samples_leaf': [1, 2, 4],
        }
        rf = RandomForestRegressor(random_state=self.random_state, n_jobs=-1)
        grid_search = GridSearchCV(estimator=rf, param_grid=param_grid, cv=3, scoring='r2', verbose=1)
        grid_search.fit(X_train_proc, y_train)
        
        print(f"\nMelhores parâmetros encontrados: {grid_search.best_params_}")
        self.model = grid_search.best_estimator_
        
        # 4. Avaliar o modelo final
        self._evaluate(X_test_proc, y_test)
        
        # 5. Salvar o MODELO (o pré-processador não precisa ser salvo de novo)
        self._save_model()
        
    def _evaluate(self, X_test_proc, y_test):
        y_pred = self.model.predict(X_test_proc)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print("\n--- Relatório de Métricas (Modelo Otimizado) ---")
        print(f"🔹 Erro Médio Absoluto (MAE): {mae:.2f}")
        print(f"🔸 Coeficiente de Determinação (R²): {r2:.2f}")

    def _save_model(self):
        joblib.dump(self.model, 'perf_reglin_model.pkl')
        print("\n💾 Modelo salvo com sucesso em 'perf_reglin_model.pkl'!")

def load_data(filepath):
    try:
        df = pd.read_csv(filepath)
        print(f"✅ Dataset '{filepath}' carregado com sucesso!")
        return df
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    print("--- INICIANDO PROCESSO DE TREINAMENTO DE MODELO ---")
    
    DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
    PREPROCESSOR_PATH = 'perf_preprocess.pkl' # <-- Caminho para o pipeline
    
    dataframe = load_data(DATASET_PATH)
    
    if dataframe is not None:
        trainer = ModelTrainer(preprocessor_path=PREPROCESSOR_PATH)
        trainer.train(dataframe)
        print("\n--- PROCESSO DE TREINAMENTO CONCLUÍDO ---")