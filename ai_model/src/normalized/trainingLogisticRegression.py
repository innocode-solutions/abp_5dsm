# =============================================================================
# ARQUIVO: 2_treinar_modelo_logistica.py
# OBJETIVO: Atender a User Story de classificação binária (Aprovado/Reprovado)
#           para prever o desempenho de estudantes e permitir ações preventivas.
# =============================================================================

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, roc_auc_score, confusion_matrix # <-- MÉTRICAS ATUALIZADAS

class ModelTrainer:
    """
    Uma classe para carregar dados e um pré-processador, e então treinar,
    avaliar e salvar um modelo de Regressão Logística conforme os critérios de aceite.
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

    def train(self, data, nota_de_corte=60): # <-- CRITÉRIO DE ACEITE: Nota de corte alterada
        """
        Executa o fluxo de treinamento usando o pré-processador já carregado.
        """
        if self.preprocessor is None:
            return

        # 1. Criar Target Binário (Critério de Aceite)
        data['Aprovado'] = (data['Exam_Score'] >= nota_de_corte).astype(int)
        print(f"\nℹ️ Target binário criado: Nota >= {nota_de_corte} -> Aprovado (1), < {nota_de_corte} -> Reprovado (0).")
        
        X = data.drop(columns=['Exam_Score', 'Aprovado'])
        y = data['Aprovado']

        # 2. Dividir os dados
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=self.random_state, stratify=y)
        print(f"\n✅ Dados brutos divididos: {len(X_train)} para treino, {len(X_test)} para teste.")
        
        # 3. Aplicar o pré-processador
        X_train_proc = self.preprocessor.transform(X_train)
        X_test_proc = self.preprocessor.transform(X_test)
        print("✅ Dados de treino e teste transformados com o pipeline carregado.")
        
        # 4. Treinamento do Modelo de Regressão Logística
        print("\n--- Treinando o modelo de Regressão Logística ---")
        self.model = LogisticRegression(random_state=self.random_state, class_weight='balanced')
        self.model.fit(X_train_proc, y_train)
        print("✅ Modelo de Regressão Logística treinado com sucesso!")
        
        # 5. Avaliar o modelo final
        self._evaluate(X_test_proc, y_test)
        
        # 6. Salvar o MODELO (Critério de Aceite)
        self._save_model()
        
    def _evaluate(self, X_test_proc, y_test):
        """Método privado para avaliar o modelo com as métricas da task."""
        y_pred = self.model.predict(X_test_proc)
        y_pred_proba = self.model.predict_proba(X_test_proc)[:, 1] # Probabilidades para a classe '1' (Aprovado)
        
        # Calcular as métricas solicitadas
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        print("\n--- Relatório de Métricas (Critérios de Aceite) ---")
        print(f"🔹 F1-Score: {f1:.4f}")
        print(f"🔸 ROC-AUC: {roc_auc:.4f}")
        print("\n📊 Matriz de Confusão:")
        print(conf_matrix)

        # Verificar as Métricas de Sucesso
        print("\n--- Verificação das Métricas de Sucesso ---")
        f1_success = "✅ Atingido" if f1 >= 0.70 else "❌ Não Atingido"
        roc_auc_success = "✅ Atingido" if roc_auc >= 0.75 else "❌ Não Atingido"
        print(f"Meta F1-Score (≥ 0,70): {f1_success}")
        print(f"Meta ROC-AUC (≥ 0,75): {roc_auc_success}")

    def _save_model(self):
        joblib.dump(self.model, 'perf_logreg_model.pkl')
        print("\n💾 Modelo salvo com sucesso em 'perf_logreg_model.pkl'!")

def load_data(filepath):
    try:
        df = pd.read_csv(filepath)
        print(f"✅ Dataset '{filepath}' carregado com sucesso!")
        return df
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    print("--- INICIANDO PROCESSO DE TREINAMENTO DE MODELO (Classificação Binária) ---")
    
    DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
    PREPROCESSOR_PATH = 'perf_preprocess.pkl'
    
    dataframe = load_data(DATASET_PATH)
    
    if dataframe is not None:
        trainer = ModelTrainer(preprocessor_path=PREPROCESSOR_PATH)
        trainer.train(dataframe)
        print("\n--- PROCESSO DE TREINAMENTO CONCLUÍDO ---")