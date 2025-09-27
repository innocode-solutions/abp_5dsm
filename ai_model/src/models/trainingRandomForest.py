# =============================================================================
# OBJETIVO: Treinar e otimizar um modelo RandomForestClassifier.
# =============================================================================

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

class ModelTrainer:
    """
    Classe para treinar, otimizar e salvar um modelo RandomForestClassifier.
    """
    def __init__(self, preprocessor_path, random_state=42):
        self.random_state = random_state
        self.model = None
        try:
            self.preprocessor = joblib.load(preprocessor_path)
            print(f"✅ Pré-processador '{preprocessor_path}' carregado com sucesso.")
        except FileNotFoundError:
            print(f"❌ Erro: Pré-processador '{preprocessor_path}' não encontrado.")
            self.preprocessor = None

    def train(self, data, nota_de_corte=60):
        if self.preprocessor is None:
            return

        # 1. Preparar os dados
        X = data.drop(columns='Exam_Score')
        y = (data['Exam_Score'] >= nota_de_corte).astype(int)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=self.random_state, stratify=y)
        print(f"\n✅ Dados brutos divididos para tarefa de CLASSIFICAÇÃO.")
        
        X_train_proc = self.preprocessor.transform(X_train)
        X_test_proc = self.preprocessor.transform(X_test)
        print("✅ Dados de treino e teste transformados.")
        
        # 3. Otimização e Treinamento
        print("\n--- Iniciando busca pelos melhores hiperparâmetros (GridSearch) ---")

        # ==========================================================================
        # !! ALTERAÇÃO PRINCIPAL AQUI !!
        # Expandimos a grade de parâmetros para uma busca mais completa.
        # ==========================================================================
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [5, 8, 10],            # <-- Tente profundidades BEM menores
            'min_samples_leaf': [5, 10, 15],    # <-- Exija um número MAIOR de amostras por folha
            'max_features': ['sqrt', 'log2']
        }
                
        rf = RandomForestClassifier(random_state=self.random_state, n_jobs=-1, class_weight='balanced')
        grid_search = GridSearchCV(estimator=rf, param_grid=param_grid, cv=5, scoring='roc_auc', verbose=2) # Aumentei cv e verbose
        grid_search.fit(X_train_proc, y_train)
        
        print(f"\nMelhores parâmetros encontrados: {grid_search.best_params_}")
        self.model = grid_search.best_estimator_
        
        # 4. Avaliar o modelo final
        self._evaluate(X_test_proc, y_test)
        
        # 5. Salvar o MODELO
        self._save_model()
        
    def _evaluate(self, X_test_proc, y_test):
        y_pred = self.model.predict(X_test_proc)
        print("\n--- Relatório de Métricas (Modelo Otimizado) ---")
        print(classification_report(y_test, y_pred, target_names=['Reprovado', 'Aprovado']))

    def _save_model(self):
        # Ajuste o caminho se necessário
        joblib.dump(self.model, '../pipelines/perf_rf_model.pkl')
        print("\n💾 Modelo RandomForestClassifier salvo com sucesso em '../pipelines/perf_rf_model.pkl'!")


# O restante do seu arquivo (load_data e if __name__ == "__main__") continua igual.
def load_data(filepath):
    try:
        df = pd.read_csv(filepath)
        print(f"✅ Dataset '{filepath}' carregado com sucesso!")
        return df
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    print("--- INICIANDO PROCESSO DE TREINAMENTO DE MODELO (Random Forest Classifier) ---")
    
    DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
    PREPROCESSOR_PATH = '../pipelines/perf_preprocess.pkl' # <-- Garanta que este caminho está correto
    
    dataframe = load_data(DATASET_PATH)
    
    if dataframe is not None:
        trainer = ModelTrainer(preprocessor_path=PREPROCESSOR_PATH)
        trainer.train(dataframe)
        print("\n--- PROCESSO DE TREINAMENTO CONCLUÍDO ---")