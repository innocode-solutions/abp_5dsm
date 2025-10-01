# =============================================================================
# ARQUIVO: treinamentoRandomForest.py (VERSÃO FINAL OTIMIZADA)
# OBJETIVO: Treinar e otimizar um modelo RandomForestClassifier, aplicando
#           hiperparâmetros restritivos para combater o overfitting.
# =============================================================================

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

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

    def train(self, data, nota_de_corte=68):
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
        
        # 2. Otimização e Treinamento com Foco em Regularização
        print("\n--- Iniciando busca pelos melhores hiperparâmetros para evitar overfitting ---")

        # Grade de parâmetros APRIMORADA para forçar o modelo a ser mais simples
        # e generalista, combatendo o vício em features específicas.
        param_grid = {
            'n_estimators': [100, 200],
            # Profundidades menores evitam que as árvores se aprofundem demais e memorizem dados
            'max_depth': [5, 8, 10],
            # Exigir mais amostras por "folha" impede a criação de regras para casos muito específicos
            'min_samples_leaf': [5, 10, 15],
            # Limitar as features por árvore aumenta a diversidade e robustez do modelo
            'max_features': ['sqrt', 'log2']
        }
        
        rf = RandomForestClassifier(random_state=self.random_state, n_jobs=-1, class_weight='balanced')
        
        # O GridSearchCV testará todas as combinações e encontrará o melhor modelo
        grid_search = GridSearchCV(
            estimator=rf,
            param_grid=param_grid,
            cv=5,               # Validação cruzada com 5 folds para mais robustez
            scoring='roc_auc',  # Métrica de otimização
            verbose=2           # Mostra o progresso detalhado da busca
        )
        grid_search.fit(X_train_proc, y_train)
        
        print(f"\nMelhores parâmetros encontrados: {grid_search.best_params_}")
        self.model = grid_search.best_estimator_
        
        # 3. Avaliar o modelo final otimizado
        self._evaluate(X_test_proc, y_test)
        
        # 4. Salvar o MODELO
        self._save_model()
        
    def _evaluate(self, X_test_proc, y_test):
        y_pred = self.model.predict(X_test_proc)
        print("\n--- Relatório de Métricas (Modelo Otimizado) ---")
        print(classification_report(y_test, y_pred, target_names=['Reprovado', 'Aprovado']))

    def _save_model(self):
        joblib.dump(self.model, '../pipelines/perf_rf_model.pkl')
        print("\n💾 Modelo RandomForestClassifier otimizado salvo com sucesso em '../pipelines/perf_rf_model.pkl'!")

def load_data(filepath):
    try:
        df = pd.read_csv(filepath)
        print(f"✅ Dataset '{filepath}' carregado com sucesso!")
        return df
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    print("--- INICIANDO PROCESSO DE TREINAMENTO OTIMIZADO (Random Forest Classifier) ---")
    
    DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
    PREPROCESSOR_PATH = '../pipelines/perf_preprocess.pkl'
    
    dataframe = load_data(DATASET_PATH)
    
    if dataframe is not None:
        trainer = ModelTrainer(preprocessor_path=PREPROCESSOR_PATH)
        trainer.train(dataframe)
        print("\n--- PROCESSO DE TREINAMENTO CONCLUÍDO ---")
