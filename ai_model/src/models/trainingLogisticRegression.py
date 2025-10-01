# =============================================================================
# OBJETIVO: Atender a User Story de classificação binária (Aprovado/Reprovado)
#           e OTIMIZAR o modelo para evitar overfitting.
# =============================================================================

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV # <-- MUDANÇA
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, roc_auc_score, confusion_matrix

class ModelTrainer:
    """
    Uma classe para carregar dados e um pré-processador, e então OTIMIZAR, treinar,
    avaliar e salvar um modelo de Regressão Logística.
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
        """
        Executa o fluxo de OTIMIZAÇÃO e treinamento do modelo.
        """
        if self.preprocessor is None:
            return

        # 1. Criar Target Binário
        data['Aprovado'] = (data['Exam_Score'] >= nota_de_corte).astype(int)
        print(f"\nℹ️ Target binário criado.")
        
        X = data.drop(columns=['Exam_Score', 'Aprovado'])
        y = data['Aprovado']

        # 2. Dividir os dados
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=self.random_state, stratify=y)
        print(f"\n✅ Dados brutos divididos.")
        
        # 3. Aplicar o pré-processador
        X_train_proc = self.preprocessor.transform(X_train)
        X_test_proc = self.preprocessor.transform(X_test)
        print("✅ Dados de treino e teste transformados com o pipeline carregado.")
        
        # ============================================================
        # 4. OTIMIZAÇÃO E TREINAMENTO DO MODELO  <-- MUDANÇA PRINCIPAL
        # ============================================================
        print("\n--- Otimizando hiperparâmetros para combater overfitting ---")
        
        # Define o modelo base
        logreg = LogisticRegression(random_state=self.random_state, class_weight='balanced', max_iter=1000, solver='liblinear')

        # Define a grade de parâmetros para testar (foco na regularização 'C')
        param_grid = {
            'penalty': ['l1', 'l2'],
            'C': [0.001, 0.01, 0.1, 1, 10, 100]  # Testa várias forças de regularização
        }

        # Configura o GridSearchCV
        grid_search = GridSearchCV(
            estimator=logreg,
            param_grid=param_grid,
            scoring='roc_auc',
            cv=5, # Validação cruzada com 5 folds
            verbose=1,
            n_jobs=-1
        )

        # Executa a busca pelos melhores parâmetros
        grid_search.fit(X_train_proc, y_train)

        # Armazena o melhor modelo encontrado
        self.model = grid_search.best_estimator_
        
        print(f"\nMelhores parâmetros encontrados: {grid_search.best_params_}")
        print(f"Melhor score ROC-AUC na validação cruzada: {grid_search.best_score_:.4f}")
        print("✅ Modelo de Regressão Logística OTIMIZADO e treinado com sucesso!")
        
        # 5. Avaliar o modelo final otimizado
        self._evaluate(X_test_proc, y_test)
        
        # 6. Salvar o MODELO otimizado
        self._save_model()
        
    def _evaluate(self, X_test_proc, y_test):
        """Método privado para avaliar o modelo com as métricas da task."""
        y_pred = self.model.predict(X_test_proc)
        y_pred_proba = self.model.predict_proba(X_test_proc)[:, 1]
        
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        print("\n--- Relatório de Métricas (Modelo Otimizado) ---")
        print(f"🔹 F1-Score: {f1:.4f}")
        print(f"🔸 ROC-AUC: {roc_auc:.4f}")
        print("\n📊 Matriz de Confusão:")
        print(conf_matrix)

    def _save_model(self):
        # Ajuste o caminho conforme a estrutura do seu projeto
        joblib.dump(self.model, './pipelines/perf_logreg_model.pkl')
        print("\n💾 Modelo otimizado salvo com sucesso em 'perf_logreg_model.pkl'!")

def load_data(filepath):
    try:
        df = pd.read_csv(filepath)
        print(f"✅ Dataset '{filepath}' carregado com sucesso!")
        return df
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    print("--- INICIANDO PROCESSO DE TREINAMENTO OTIMIZADO (Classificação Binária) ---")
    
    DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
    PREPROCESSOR_PATH = './pipelines/perf_preprocess.pkl' # <-- Garanta que este caminho está correto
    
    dataframe = load_data(DATASET_PATH)
    
    if dataframe is not None:
        trainer = ModelTrainer(preprocessor_path=PREPROCESSOR_PATH)
        trainer.train(dataframe)
        print("\n--- PROCESSO DE TREINAMENTO CONCLUÍDO ---")