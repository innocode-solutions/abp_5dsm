# =============================================================================
# ARQUIVO: 3_comparar_modelos.py
# OBJETIVO: Comparar os modelos de Classificação e Regressão para definir
#           a melhor abordagem para o MVP.
#           - Calcula métricas apropriadas para cada modelo.
#           - Gera os gráficos corretos para cada tarefa.
#           - Imprime uma documentação clara da decisão.
# =============================================================================

import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    f1_score, roc_auc_score, roc_curve,  # Métricas de Classificação
    mean_absolute_error, r2_score      # Métricas de Regressão
)

# --- CONFIGURAÇÕES ---
DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
PREPROCESSOR_PATH = 'perf_preprocess.pkl'
LOGREG_MODEL_PATH = 'perf_logreg_model.pkl'
LINREG_MODEL_PATH = 'perf_reglin_model.pkl' # Corrigido o nome do arquivo
NOTA_DE_CORTE = 60
RANDOM_STATE = 42

# --- LÓGICA PRINCIPAL ---
print("Iniciando a comparação de modelos (Classificação vs. Regressão)...")

# Carregar tudo
try:
    df = pd.read_csv(DATASET_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    logreg_model = joblib.load(LOGREG_MODEL_PATH)
    linreg_model = joblib.load(LINREG_MODEL_PATH) # Corrigido o nome da variável
    print("✅ Dados, pré-processador e modelos carregados.")
except FileNotFoundError:
    print("❌ ERRO: Modelos não encontrados. Execute os scripts de treinamento primeiro.")
    exit()

# --- PREPARAÇÃO DOS DADOS ---
X = df.drop('Exam_Score', axis=1)

# Alvo para Regressão (a nota real)
y_reg = df['Exam_Score']
# Alvo para Classificação (Aprovado/Reprovado)
y_class = (df['Exam_Score'] >= NOTA_DE_CORTE).astype(int)

# Dividir dados para teste (usando o mesmo X e random_state para consistência)
_, X_test, _, y_test_reg = train_test_split(X, y_reg, test_size=0.2, random_state=RANDOM_STATE)
_, X_test, _, y_test_class = train_test_split(X, y_class, test_size=0.2, random_state=RANDOM_STATE, stratify=y_class)

# Pré-processar as features do conjunto de teste
X_test_proc = preprocessor.transform(X_test)
print(f"Dados de teste preparados com {len(X_test)} amostras.")


# --- 1. AVALIAÇÃO DO MODELO DE CLASSIFICAÇÃO (REGRESSÃO LOGÍSTICA) ---
print("\n--- Avaliando Regressão Logística (Classificação) ---")
y_pred_class = logreg_model.predict(X_test_proc)
y_proba_class = logreg_model.predict_proba(X_test_proc)[:, 1]

f1 = f1_score(y_test_class, y_pred_class)
roc_auc = roc_auc_score(y_test_class, y_proba_class)
print(f"🔹 F1-Score: {f1:.4f}")
print(f"🔸 ROC-AUC:  {roc_auc:.4f}")


# --- 2. AVALIAÇÃO DO MODELO DE REGRESSÃO (REGRESSÃO LINEAR) ---
print("\n--- Avaliando Regressão Linear (Regressão) ---")
y_pred_reg = linreg_model.predict(X_test_proc)

mae = mean_absolute_error(y_test_reg, y_pred_reg)
r2 = r2_score(y_test_reg, y_pred_reg)
print(f"🔹 Erro Médio Absoluto (MAE): {mae:.2f} pontos")
print(f"🔸 Coeficiente de Determinação (R²): {r2:.2f}")


# --- 3. GERAÇÃO DE GRÁFICOS ---
# Gráfico 1: Curva ROC para o modelo de Classificação
plt.figure(figsize=(10, 7))
fpr, tpr, _ = roc_curve(y_test_class, y_proba_class)
plt.plot(fpr, tpr, label=f"Regressão Logística (AUC = {roc_auc:.2f})")
plt.plot([0, 1], [0, 1], 'k--', label='Chance (AUC = 0.50)')
plt.xlabel('Taxa de Falsos Positivos')
plt.ylabel('Taxa de Verdadeiros Positivos')
plt.title('Curva ROC para Modelo de Classificação')
plt.legend()
plt.grid()
plt.savefig('grafico_curva_roc.png')
print("\n✅ Gráfico da Curva ROC salvo como 'grafico_curva_roc.png'.")

# Gráfico 2: Gráfico de Resíduos para o modelo de Regressão
plt.figure(figsize=(10, 7))
residuals = y_test_reg - y_pred_reg
sns.scatterplot(x=y_pred_reg, y=residuals)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('Valores Previstos (Nota do Exame)')
plt.ylabel('Resíduos (Real - Previsto)')
plt.title('Gráfico de Resíduos para Modelo de Regressão')
plt.grid()
plt.savefig('grafico_residuos.png')
print("✅ Gráfico de Resíduos salvo como 'grafico_residuos.png'.")


# --- 4. DOCUMENTAÇÃO DA DECISÃO ---
print("\n\n" + "="*60)
print("--- DOCUMENTAÇÃO DA DECISÃO DO BASELINE PARA O MVP ---")
print("="*60)

# Tabela comparativa
summary_data = {
    'Modelo': ['Regressão Logística', 'Regressão Linear'],
    'Tarefa': ['Classificação', 'Regressão'],
    'Métrica Principal': ['ROC-AUC', 'MAE (Erro em Pontos)'],
    'Valor': [f"{roc_auc:.4f}", f"{mae:.2f}"],
    'Métrica Secundária': ['F1-Score', 'R²'],
    'Valor ': [f"{f1:.4f}", f"{r2:.2f}"]
}
summary_df = pd.DataFrame(summary_data)
print("\n**Tabela Comparativa de Métricas:**")
print(summary_df.to_string(index=False))

print("\n\n**Qual abordagem escolher para o MVP?**")
print("""
A escolha do modelo não depende apenas das métricas, mas do **problema de negócio** que o MVP precisa resolver:

1.  **Escolha a REGRESSÃO LOGÍSTICA (Classificação) se a pergunta principal for:**
    "Quais alunos estão em risco de serem REPROVADOS?"
    - **Vantagem:** Fornece uma resposta direta e acionável (Sim/Não), ideal para criar alertas e direcionar intervenções. É mais simples para um MVP focado em ações preventivas.

2.  **Escolha a REGRESSÃO LINEAR se a pergunta principal for:**
    "Qual será a NOTA FINAL aproximada de cada aluno?"
    - **Vantagem:** Oferece uma visão mais granular do desempenho. Permite diferenciar um aluno que pode tirar 58 de um que pode tirar 30, mesmo que ambos sejam "reprovados".

**Recomendação para o Baseline:**
Para um MVP cujo objetivo é **"permitir ações preventivas"**, a abordagem de **Classificação com a Regressão Logística** é geralmente mais indicada. Ela responde à pergunta de negócio mais crítica de forma direta e simples.
""")
print("="*60)