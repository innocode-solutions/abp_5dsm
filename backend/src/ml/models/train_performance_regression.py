#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para treinar modelo de REGRESSÃO para predição de desempenho
Retorna a nota real (0-100) ao invés de apenas classificar aprovado/reprovado
"""

import sys
import pandas as pd
import joblib
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, make_scorer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.base import BaseEstimator, RegressorMixin
import warnings
warnings.filterwarnings('ignore')

def asymmetric_loss(y_true, y_pred):
    """
    Função de perda assimétrica que penaliza mais quando:
    - Nota real é baixa (< 60) mas predição é alta (>= 60)
    - Nota real é alta (>= 70) mas predição é baixa (< 70)
    """
    penalty = np.zeros_like(y_true)
    
    # Penalizar mais quando nota real é baixa mas predição é alta
    low_real_high_pred = (y_true < 60) & (y_pred >= 60)
    penalty[low_real_high_pred] = 5.0  # Penalidade alta
    
    # Penalizar quando nota real é alta mas predição é baixa
    high_real_low_pred = (y_true >= 70) & (y_pred < 70)
    penalty[high_real_low_pred] = 3.0  # Penalidade média
    
    # Erro padrão para outros casos
    base_error = np.abs(y_true - y_pred)
    
    return np.mean(base_error + penalty)

class AsymmetricGradientBoosting(BaseEstimator, RegressorMixin):
    """
    Wrapper para GradientBoostingRegressor com função de perda customizada
    que penaliza mais erros quando nota real é baixa mas predição é alta
    """
    def __init__(self, n_estimators=300, max_depth=10, learning_rate=0.03, 
                 random_state=42, min_samples_split=2, min_samples_leaf=1, subsample=0.8):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.random_state = random_state
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.subsample = subsample
        self.model = None
    
    def _asymmetric_loss_grad(self, y_true, y_pred):
        """Gradiente da função de perda assimétrica"""
        grad = np.zeros_like(y_pred)
        error = y_pred - y_true
        
        # Para casos onde nota real é baixa (< 60) mas predição é alta (>= 60)
        low_real_high_pred = (y_true < 60) & (y_pred >= 60)
        grad[low_real_high_pred] = 10.0 * np.sign(error[low_real_high_pred])  # Penalidade alta
        
        # Para casos normais, usar gradiente padrão (MAE)
        normal_mask = ~low_real_high_pred
        grad[normal_mask] = np.sign(error[normal_mask])
        
        return grad
    
    def fit(self, X, y, sample_weight=None):
        """Treina o modelo com perda assimétrica"""
        # Usar GradientBoosting com perda customizada via sample_weight ajustado
        # Aumentar sample_weight para casos críticos
        if sample_weight is None:
            sample_weight = np.ones(len(y))
        
        # Aumentar ainda mais o peso para casos baixos
        low_score_mask = y < 60
        sample_weight[low_score_mask] = sample_weight[low_score_mask] * 10.0
        
        self.model = GradientBoostingRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            random_state=self.random_state,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            subsample=self.subsample,
            loss='absolute_error'
        )
        self.model.fit(X, y, sample_weight=sample_weight)
        return self
    
    def predict(self, X):
        """Faz predições"""
        if self.model is None:
            raise ValueError("Modelo não foi treinado ainda")
        predictions = self.model.predict(X)
        
        # Aplicar correção conservadora: se a predição está muito próxima de 60
        # e os valores de entrada sugerem baixo desempenho, reduzir um pouco
        # (Isso é uma heurística, mas ajuda a evitar falsos positivos)
        # Nota: Esta correção será aplicada apenas se necessário
        
        return predictions

# Configuração de caminhos
BASE_DIR = Path(__file__).resolve().parent.parent
PREPROCESSOR_PATH = BASE_DIR / "pipelines" / "perf_preprocess.pkl"
DATA_PATH = BASE_DIR / "datasets" / "StudentPerformanceFactors.csv"
MODEL_PATH = BASE_DIR / "pipelines" / "perf_regression_model.pkl"

RANDOM_STATE = 42
TEST_SIZE = 0.2

def load_data():
    """Carrega o dataset"""
    try:
        df = pd.read_csv(DATA_PATH)
        print(f"✅ Dataset carregado: {len(df)} registros, {len(df.columns)} colunas")
        return df
    except FileNotFoundError:
        print(f"❌ Erro: Dataset não encontrado em {DATA_PATH}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro ao carregar dataset: {str(e)}")
        sys.exit(1)

def load_preprocessor():
    """Carrega o pré-processador existente"""
    try:
        preprocessor = joblib.load(PREPROCESSOR_PATH)
        print("✅ Pré-processador carregado")
        return preprocessor
    except FileNotFoundError:
        print(f"❌ Erro: Pré-processador não encontrado em {PREPROCESSOR_PATH}")
        print("   Execute primeiro o script de treinamento do pré-processador")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro ao carregar pré-processador: {str(e)}")
        sys.exit(1)

def generate_extreme_cases(X, num_cases=50):
    """
    Gera casos extremos sintéticos para o modelo aprender:
    - Casos com tudo negativo/mínimo → target = 0
    - Casos com tudo positivo/máximo → target = 100
    """
    extreme_cases = []
    extreme_targets = []
    
    # Identificar features numéricas e categóricas
    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = X.select_dtypes(exclude=[np.number]).columns.tolist()
    
    print(f"\n🔧 Gerando casos extremos sintéticos...")
    print(f"   Features numéricas: {numeric_features}")
    print(f"   Features categóricas: {categorical_features}")
    
    # Obter valores mínimos e máximos para features numéricas
    numeric_mins = X[numeric_features].min()
    numeric_maxs = X[numeric_features].max()
    
    # Obter valores possíveis para features categóricas
    # Mapeamento específico para cada feature baseado nos valores reais do dataset
    categorical_mapping = {
        'Gender': {'negative': 'Male', 'positive': 'Female'},  # Não importa muito, usar qualquer um
        'Parental_Education_Level': {'negative': 'High School', 'positive': 'Postgraduate'},
        'Parental_Involvement': {'negative': 'Low', 'positive': 'High'},
        'School_Type': {'negative': 'Public', 'positive': 'Private'},
        'Peer_Influence': {'negative': 'Negative', 'positive': 'Positive'},
        'Extracurricular_Activities': {'negative': 'No', 'positive': 'Yes'},
        'Learning_Disabilities': {'negative': 'Yes', 'positive': 'No'},  # Ter deficiência é negativo
        'Internet_Access': {'negative': 'No', 'positive': 'Yes'},
        'Access_to_Resources': {'negative': 'Low', 'positive': 'High'},
        'Teacher_Quality': {'negative': 'Low', 'positive': 'High'},
        'Family_Income': {'negative': 'Low', 'positive': 'High'},
        'Motivation_Level': {'negative': 'Low', 'positive': 'High'},
        'Tutoring_Sessions': {'negative': '0', 'positive': '4'},  # Numérico como string
        'Physical_Activity': {'negative': 'Low', 'positive': 'High'},
        'Distance_from_Home': {'negative': 'Far', 'positive': 'Near'},  # Perto é melhor
    }
    
    categorical_values = {}
    for col in categorical_features:
        unique_vals = X[col].unique().tolist()
        
        # Se temos mapeamento específico, usar ele
        if col in categorical_mapping:
            mapping = categorical_mapping[col]
            # Verificar se os valores do mapeamento existem no dataset
            negative_val = mapping['negative'] if mapping['negative'] in unique_vals else unique_vals[0]
            positive_val = mapping['positive'] if mapping['positive'] in unique_vals else unique_vals[-1] if len(unique_vals) > 1 else unique_vals[0]
        else:
            # Fallback: identificar valores "negativos" e "positivos" por palavras-chave
            negative_vals = [v for v in unique_vals if any(neg in str(v).lower() for neg in ['low', 'no', 'negative', 'none', 'bad', 'far', '0'])]
            positive_vals = [v for v in unique_vals if any(pos in str(v).lower() for pos in ['high', 'yes', 'positive', 'good', 'excellent', 'near', '4'])]
            
            negative_val = negative_vals[0] if negative_vals else unique_vals[0]
            positive_val = positive_vals[0] if positive_vals else (unique_vals[-1] if len(unique_vals) > 1 else unique_vals[0])
        
        categorical_values[col] = {
            'negative': negative_val,
            'positive': positive_val,
            'all': unique_vals
        }
        
        print(f"   {col}: negativo='{negative_val}', positivo='{positive_val}'")
    
    # Gerar casos com tudo negativo → target = 0
    # Adicionar pequenas variações para tornar mais realista
    np.random.seed(42)  # Para reprodutibilidade
    for i in range(num_cases):
        case = {}
        # Features numéricas no mínimo ou muito próximas do mínimo (com pequena variação)
        for col in numeric_features:
            range_val = numeric_maxs[col] - numeric_mins[col]
            # 90% dos casos no mínimo exato, 10% com pequena variação (até 5% do range)
            if np.random.random() < 0.9:
                case[col] = numeric_mins[col]
            else:
                case[col] = numeric_mins[col] + range_val * np.random.uniform(0, 0.05)
        # Features categóricas nos valores "negativos" (maioria) ou próximos
        for col in categorical_features:
            # 80% dos casos no valor negativo, 20% em valores neutros/baixos
            if np.random.random() < 0.8:
                case[col] = categorical_values[col]['negative']
            else:
                # Escolher um valor neutro ou baixo aleatório
                all_vals = categorical_values[col]['all']
                # Priorizar valores que não sejam os mais positivos
                non_positive_vals = [v for v in all_vals if v != categorical_values[col]['positive']]
                case[col] = np.random.choice(non_positive_vals) if non_positive_vals else categorical_values[col]['negative']
        extreme_cases.append(case)
        extreme_targets.append(0.0)  # Target = 0 quando tudo é negativo
    
    # Gerar casos com tudo positivo → target = 100
    for i in range(num_cases):
        case = {}
        # Features numéricas no máximo ou muito próximas do máximo (com pequena variação)
        for col in numeric_features:
            range_val = numeric_maxs[col] - numeric_mins[col]
            # 90% dos casos no máximo exato, 10% com pequena variação (até 5% do range)
            if np.random.random() < 0.9:
                case[col] = numeric_maxs[col]
            else:
                case[col] = numeric_maxs[col] - range_val * np.random.uniform(0, 0.05)
        # Features categóricas nos valores "positivos" (maioria) ou próximos
        for col in categorical_features:
            # 80% dos casos no valor positivo, 20% em valores neutros/altos
            if np.random.random() < 0.8:
                case[col] = categorical_values[col]['positive']
            else:
                # Escolher um valor neutro ou alto aleatório
                all_vals = categorical_values[col]['all']
                # Priorizar valores que não sejam os mais negativos
                non_negative_vals = [v for v in all_vals if v != categorical_values[col]['negative']]
                case[col] = np.random.choice(non_negative_vals) if non_negative_vals else categorical_values[col]['positive']
        extreme_cases.append(case)
        extreme_targets.append(100.0)  # Target = 100 quando tudo é positivo
    
    # Gerar casos intermediários também (para suavizar a transição)
    for i in range(num_cases // 2):
        # Caso com valores muito baixos (mas não mínimos) → target próximo de 0
        case = {}
        for col in numeric_features:
            case[col] = numeric_mins[col] + (numeric_maxs[col] - numeric_mins[col]) * 0.1  # 10% do range
        for col in categorical_features:
            # Misturar alguns valores negativos e neutros
            if i % 2 == 0:
                case[col] = categorical_values[col]['negative']
            else:
                case[col] = categorical_values[col]['all'][len(categorical_values[col]['all']) // 2] if len(categorical_values[col]['all']) > 1 else categorical_values[col]['negative']
        extreme_cases.append(case)
        extreme_targets.append(10.0)  # Target baixo mas não zero
        
        # Caso com valores muito altos (mas não máximos) → target próximo de 100
        case = {}
        for col in numeric_features:
            case[col] = numeric_maxs[col] - (numeric_maxs[col] - numeric_mins[col]) * 0.1  # 90% do range
        for col in categorical_features:
            # Misturar alguns valores positivos e neutros
            if i % 2 == 0:
                case[col] = categorical_values[col]['positive']
            else:
                case[col] = categorical_values[col]['all'][len(categorical_values[col]['all']) // 2] if len(categorical_values[col]['all']) > 1 else categorical_values[col]['positive']
        extreme_cases.append(case)
        extreme_targets.append(90.0)  # Target alto mas não 100
    
    extreme_df = pd.DataFrame(extreme_cases)
    extreme_targets_series = pd.Series(extreme_targets)
    
    print(f"   ✅ Gerados {len(extreme_cases)} casos extremos:")
    print(f"      - {num_cases} casos com tudo negativo → target = 0")
    print(f"      - {num_cases} casos com tudo positivo → target = 100")
    print(f"      - {num_cases // 2} casos intermediários baixos → target = 10")
    print(f"      - {num_cases // 2} casos intermediários altos → target = 90")
    
    return extreme_df, extreme_targets_series

def train_regression_model(df, preprocessor):
    """Treina modelo de regressão para prever a nota real"""
    
    # Separar features e target
    # REMOVER Previous_Scores para evitar viés (o modelo não deve usar notas anteriores)
    X = df.drop(['Exam_Score', 'Previous_Scores'], axis=1)
    y = df['Exam_Score']
    
    print(f"\n⚠️ Campo 'Previous_Scores' removido do treinamento para evitar viés")
    print(f"   Features restantes: {list(X.columns)}")
    
    # Garantir que as colunas estão na ordem esperada pelo preprocessor
    if hasattr(preprocessor, 'feature_names_in_'):
        expected_features = list(preprocessor.feature_names_in_)
        print(f"\n🔍 Verificando ordem das colunas...")
        print(f"   Features esperadas pelo preprocessor: {expected_features}")
        
        # Verificar se todas as features esperadas estão presentes
        missing_features = [f for f in expected_features if f not in X.columns]
        if missing_features:
            print(f"⚠️ Features faltando: {missing_features}")
            sys.exit(1)
        
        # Reordenar as colunas para corresponder à ordem esperada pelo preprocessor
        X = X[expected_features]
        print(f"✅ Colunas reordenadas para corresponder ao preprocessor")
    
    # GERAR CASOS EXTREMOS SINTÉTICOS para o modelo aprender padrões extremos
    # Aumentar número de casos extremos para garantir que o modelo aprenda bem
    print(f"\n🎯 Adicionando casos extremos sintéticos ao dataset...")
    extreme_X, extreme_y = generate_extreme_cases(X, num_cases=300)  # Aumentado para 300 casos de cada tipo para garantir aprendizado
    
    # Garantir que os casos extremos tenham as mesmas colunas na mesma ordem
    extreme_X = extreme_X[expected_features] if hasattr(preprocessor, 'feature_names_in_') else extreme_X
    
    # Combinar dados originais com casos extremos
    X_combined = pd.concat([X, extreme_X], ignore_index=True)
    y_combined = pd.concat([y, extreme_y], ignore_index=True)
    
    print(f"   Dataset original: {len(X)} registros")
    print(f"   Casos extremos adicionados: {len(extreme_X)} registros")
    print(f"   Dataset combinado: {len(X_combined)} registros")
    
    print(f"\n📊 Estatísticas do target (Exam_Score) após adicionar casos extremos:")
    print(f"   Média: {y_combined.mean():.2f}")
    print(f"   Desvio padrão: {y_combined.std():.2f}")
    print(f"   Mínimo: {y_combined.min():.2f}")
    print(f"   Máximo: {y_combined.max():.2f}")
    
    # Dividir dados
    X_train, X_test, y_train, y_test = train_test_split(
        X_combined, y_combined, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    print(f"\n✅ Dados divididos: {len(X_train)} treino, {len(X_test)} teste")
    
    # Criar sample weights para dar mais importância a casos críticos e extremos
    # Casos extremos (0 ou 100) recebem peso muito alto para garantir que o modelo aprenda
    # Casos com notas baixas (< 60) recebem peso 5x maior
    # Casos com notas muito baixas (< 55) recebem peso 10x maior
    sample_weights_train = np.ones(len(y_train))
    
    # Dar peso MUITO ALTO para casos extremos (0 e 100) para garantir que o modelo aprenda
    extreme_zero_mask = (y_train == 0.0) | (y_train < 5.0)
    extreme_hundred_mask = (y_train == 100.0) | (y_train > 95.0)
    sample_weights_train[extreme_zero_mask] = 50.0  # Peso MUITO ALTO para casos = 0 (aumentado de 20 para 50)
    sample_weights_train[extreme_hundred_mask] = 50.0  # Peso MUITO ALTO para casos = 100 (aumentado de 20 para 50)
    
    # Casos baixos e muito baixos
    low_score_mask = (y_train < 60) & ~extreme_zero_mask
    very_low_score_mask = (y_train < 55) & ~extreme_zero_mask
    sample_weights_train[low_score_mask] = 5.0
    sample_weights_train[very_low_score_mask] = 10.0
    
    print(f"📊 Distribuição de pesos:")
    print(f"   Casos normais: {(sample_weights_train == 1.0).sum()}")
    print(f"   Casos extremos (0 ou 100): {(extreme_zero_mask.sum() + extreme_hundred_mask.sum())}")
    print(f"   Casos baixos (< 60): {low_score_mask.sum()}")
    print(f"   Casos muito baixos (< 55): {very_low_score_mask.sum()}")
    
    # Aplicar pré-processamento
    print("\n🔄 Aplicando pré-processamento...")
    X_train_proc = preprocessor.transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    print(f"✅ Dados pré-processados: {X_train_proc.shape[1]} features")
    
    # Treinar múltiplos modelos e escolher o melhor
    # Ajustados para melhor sensibilidade a valores baixos
    models = {
        'Random Forest Regressor': RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_split=3,
            min_samples_leaf=1,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            max_features='sqrt'  # Reduz overfitting
        ),
        'Gradient Boosting Regressor': GradientBoostingRegressor(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.05,  # Learning rate menor para melhor generalização
            random_state=RANDOM_STATE,
            min_samples_split=3,
            min_samples_leaf=1,
            subsample=0.8  # Reduz overfitting
        )
    }
    
    best_model = None
    best_name = None
    best_score = float('inf')
    results = {}
    
    print("\n🔍 Treinando e comparando modelos...")
    for name, model in models.items():
        print(f"\n--- Treinando {name} ---")
        # Usar sample_weights para dar mais importância a casos críticos
        model.fit(X_train_proc, y_train, sample_weight=sample_weights_train)
        
        # Avaliar
        y_pred_train = model.predict(X_train_proc)
        y_pred_test = model.predict(X_test_proc)
        
        mae_train = mean_absolute_error(y_train, y_pred_train)
        mae_test = mean_absolute_error(y_test, y_pred_test)
        rmse_test = np.sqrt(mean_squared_error(y_test, y_pred_test))
        r2_test = r2_score(y_test, y_pred_test)
        
        # Calcular perda assimétrica (penaliza mais erros críticos)
        asym_loss_test = asymmetric_loss(y_test.values, y_pred_test)
        
        results[name] = {
            'mae_train': mae_train,
            'mae_test': mae_test,
            'rmse_test': rmse_test,
            'r2_test': r2_test,
            'asym_loss_test': asym_loss_test,
            'model': model
        }
        
        print(f"   MAE (treino): {mae_train:.2f}")
        print(f"   MAE (teste): {mae_test:.2f}")
        print(f"   RMSE (teste): {rmse_test:.2f}")
        print(f"   R² (teste): {r2_test:.4f}")
        print(f"   Perda Assimétrica (teste): {asym_loss_test:.2f}")
        
        # Escolher o melhor modelo baseado na perda assimétrica (prioriza evitar falsos positivos/negativos)
        if asym_loss_test < best_score:
            best_score = asym_loss_test
            best_model = model
            best_name = name
    
    print(f"\n🏆 Melhor modelo: {best_name} (Perda Assimétrica: {best_score:.2f})")
    
    # Estatísticas detalhadas do melhor modelo
    y_pred_test = best_model.predict(X_test_proc)
    errors = y_test - y_pred_test
    
    print(f"\n📈 Estatísticas de erro do melhor modelo:")
    print(f"   MAE médio: {np.mean(np.abs(errors)):.2f}")
    print(f"   Erro médio: {np.mean(errors):.2f}")
    print(f"   Desvio padrão do erro: {np.std(errors):.2f}")
    print(f"   Erros dentro de ±5 pontos: {(np.abs(errors) <= 5).sum() / len(errors) * 100:.1f}%")
    print(f"   Erros dentro de ±10 pontos: {(np.abs(errors) <= 10).sum() / len(errors) * 100:.1f}%")
    
    # Verificar viés do modelo (tendência a retornar valores próximos à média)
    print(f"\n🔍 Análise de viés do modelo:")
    print(f"   Média das predições: {np.mean(y_pred_test):.2f}")
    print(f"   Média dos valores reais: {np.mean(y_test):.2f}")
    print(f"   Diferença (viés): {np.mean(y_pred_test) - np.mean(y_test):.2f}")
    
    # Verificar comportamento para valores baixos
    low_score_mask = y_test < 60
    if low_score_mask.sum() > 0:
        low_pred = y_pred_test[low_score_mask]
        low_real = y_test[low_score_mask]
        print(f"\n📉 Comportamento para notas baixas (< 60):")
        print(f"   Quantidade de casos: {low_score_mask.sum()}")
        print(f"   Média real: {np.mean(low_real):.2f}")
        print(f"   Média predita: {np.mean(low_pred):.2f}")
        print(f"   Erro médio: {np.mean(low_pred - low_real):.2f}")
        print(f"   Casos onde predição > 60 (falso positivo): {(low_pred >= 60).sum()} ({(low_pred >= 60).sum() / len(low_pred) * 100:.1f}%)")
    
    # Verificar comportamento para valores altos
    high_score_mask = y_test >= 70
    if high_score_mask.sum() > 0:
        high_pred = y_pred_test[high_score_mask]
        high_real = y_test[high_score_mask]
        print(f"\n📈 Comportamento para notas altas (>= 70):")
        print(f"   Quantidade de casos: {high_score_mask.sum()}")
        print(f"   Média real: {np.mean(high_real):.2f}")
        print(f"   Média predita: {np.mean(high_pred):.2f}")
        print(f"   Erro médio: {np.mean(high_pred - high_real):.2f}")
    
    # Exemplos de predições
    print(f"\n📋 Exemplos de predições (primeiros 10 do teste):")
    for i in range(min(10, len(y_test))):
        print(f"   Real: {y_test.iloc[i]:.1f} | Predito: {y_pred_test[i]:.1f} | Erro: {errors.iloc[i]:.1f}")
    
    # Exemplos específicos de casos baixos
    if low_score_mask.sum() > 0:
        print(f"\n📋 Exemplos de casos com nota baixa (< 60):")
        low_indices = np.where(low_score_mask)[0][:5]
        for idx in low_indices:
            print(f"   Real: {y_test.iloc[idx]:.1f} | Predito: {y_pred_test[idx]:.1f} | Erro: {errors.iloc[idx]:.1f}")
    
    # Verificar comportamento para casos extremos (0 e 100) - CRÍTICO
    extreme_zero_mask = (y_test == 0.0) | (y_test < 5.0)
    extreme_hundred_mask = (y_test == 100.0) | (y_test > 95.0)
    
    if extreme_zero_mask.sum() > 0:
        zero_pred = y_pred_test[extreme_zero_mask]
        zero_real = y_test[extreme_zero_mask]
        print(f"\n🎯 Comportamento para casos extremos baixos (target = 0):")
        print(f"   Quantidade de casos: {extreme_zero_mask.sum()}")
        print(f"   Média real: {np.mean(zero_real):.2f}")
        print(f"   Média predita: {np.mean(zero_pred):.2f}")
        print(f"   Erro médio: {np.mean(zero_pred - zero_real):.2f}")
        print(f"   Casos onde predição está dentro de ±5 pontos de 0: {(np.abs(zero_pred) <= 5).sum()} ({(np.abs(zero_pred) <= 5).sum() / len(zero_pred) * 100:.1f}%)")
        print(f"   Casos onde predição está dentro de ±10 pontos de 0: {(np.abs(zero_pred) <= 10).sum()} ({(np.abs(zero_pred) <= 10).sum() / len(zero_pred) * 100:.1f}%)")
    
    if extreme_hundred_mask.sum() > 0:
        hundred_pred = y_pred_test[extreme_hundred_mask]
        hundred_real = y_test[extreme_hundred_mask]
        print(f"\n🎯 Comportamento para casos extremos altos (target = 100):")
        print(f"   Quantidade de casos: {extreme_hundred_mask.sum()}")
        print(f"   Média real: {np.mean(hundred_real):.2f}")
        print(f"   Média predita: {np.mean(hundred_pred):.2f}")
        print(f"   Erro médio: {np.mean(hundred_pred - hundred_real):.2f}")
        print(f"   Casos onde predição está dentro de ±5 pontos de 100: {(np.abs(hundred_pred - 100) <= 5).sum()} ({(np.abs(hundred_pred - 100) <= 5).sum() / len(hundred_pred) * 100:.1f}%)")
        print(f"   Casos onde predição está dentro de ±10 pontos de 100: {(np.abs(hundred_pred - 100) <= 10).sum()} ({(np.abs(hundred_pred - 100) <= 10).sum() / len(hundred_pred) * 100:.1f}%)")
    
    return best_model, best_name, results

def save_model(model, model_path):
    """Salva o modelo treinado"""
    try:
        model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, model_path)
        print(f"\n✅ Modelo salvo em: {model_path}")
    except Exception as e:
        print(f"❌ Erro ao salvar modelo: {str(e)}")
        sys.exit(1)

def main():
    print("=" * 60)
    print("TREINAMENTO DE MODELO DE REGRESSÃO PARA DESEMPENHO")
    print("=" * 60)
    
    # 1. Carregar dados
    df = load_data()
    
    # 2. Carregar pré-processador
    preprocessor = load_preprocessor()
    
    # 3. Treinar modelo
    model, model_name, results = train_regression_model(df, preprocessor)
    
    # 4. Salvar modelo
    save_model(model, MODEL_PATH)
    
    print("\n" + "=" * 60)
    print("✅ TREINAMENTO CONCLUÍDO COM SUCESSO!")
    print("=" * 60)
    print(f"\n📝 Modelo salvo: {MODEL_PATH}")
    print(f"📝 Modelo escolhido: {model_name}")
    print(f"\n💡 Próximos passos:")
    print(f"   1. Atualize o script performance_predict.py para usar este modelo")
    print(f"   2. O modelo retorna a nota real (0-100) ao invés de probabilidade")

if __name__ == "__main__":
    main()

