#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para adicionar casos com baixo desempenho ao dataset
Gera registros com valores baixos que resultam em notas < 60
"""

import pandas as pd
import numpy as np
from pathlib import Path
import random

# Configuração de caminhos
BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "datasets" / "StudentPerformanceFactors.csv"
OUTPUT_PATH = BASE_DIR / "datasets" / "StudentPerformanceFactors.csv"

# Valores possíveis para campos categóricos
PARENTAL_INVOLVEMENT = ['Low', 'Medium', 'High']
ACCESS_TO_RESOURCES = ['Low', 'Medium', 'High']
EXTRACURRICULAR = ['Yes', 'No']
MOTIVATION_LEVEL = ['Low', 'Medium', 'High']
INTERNET_ACCESS = ['Yes', 'No']
TUTORING_SESSIONS = ['0', '1', '2', '3', '4']
FAMILY_INCOME = ['Low', 'Medium', 'High']
TEACHER_QUALITY = ['Low', 'Medium', 'High']
SCHOOL_TYPE = ['Public', 'Private']
PEER_INFLUENCE = ['Negative', 'Neutral', 'Positive']
PHYSICAL_ACTIVITY = ['Low', 'Medium', 'High']
LEARNING_DISABILITIES = ['Yes', 'No']
PARENTAL_EDUCATION = ['High School', 'College', 'Postgraduate']
DISTANCE_FROM_HOME = ['Near', 'Moderate', 'Far']
GENDER = ['Male', 'Female']

def generate_low_performance_case(target_score):
    """
    Gera um caso com baixo desempenho que resulta em uma nota específica
    target_score: nota desejada (entre 30-59)
    """
    # Valores baixos para features numéricas principais
    if target_score < 45:
        # Casos muito baixos (< 45)
        hours_studied = random.randint(1, 8)
        attendance = random.randint(50, 65)
        previous_scores = random.randint(25, 40)
        sleep_hours = random.randint(4, 6)
        motivation = 'Low'
        parental_involvement = 'Low'
        access_resources = 'Low'
        teacher_quality = 'Low'
        family_income = 'Low'
        peer_influence = 'Negative'
        extracurricular = 'No'
        tutoring = '0'
    elif target_score < 50:
        # Casos baixos (45-50)
        hours_studied = random.randint(3, 12)
        attendance = random.randint(55, 70)
        previous_scores = random.randint(35, 48)
        sleep_hours = random.randint(5, 7)
        motivation = random.choice(['Low', 'Medium'])
        parental_involvement = random.choice(['Low', 'Medium'])
        access_resources = random.choice(['Low', 'Medium'])
        teacher_quality = random.choice(['Low', 'Medium'])
        family_income = random.choice(['Low', 'Medium'])
        peer_influence = random.choice(['Negative', 'Neutral'])
        extracurricular = random.choice(['No', 'Yes'])
        tutoring = random.choice(['0', '1'])
    else:
        # Casos médio-baixos (50-59)
        hours_studied = random.randint(8, 15)
        attendance = random.randint(60, 75)
        previous_scores = random.randint(45, 55)
        sleep_hours = random.randint(6, 8)
        motivation = random.choice(['Low', 'Medium'])
        parental_involvement = random.choice(['Low', 'Medium'])
        access_resources = random.choice(['Low', 'Medium', 'High'])
        teacher_quality = random.choice(['Low', 'Medium'])
        family_income = random.choice(['Low', 'Medium'])
        peer_influence = random.choice(['Negative', 'Neutral', 'Positive'])
        extracurricular = random.choice(['No', 'Yes'])
        tutoring = random.choice(['0', '1', '2'])
    
    # Campos adicionais (variados mas tendendo a valores negativos)
    learning_disabilities = random.choice(['No', 'Yes']) if target_score < 50 else 'No'
    internet_access = random.choice(['Yes', 'No'])
    physical_activity = random.choice(['Low', 'Medium']) if target_score < 50 else random.choice(['Low', 'Medium', 'High'])
    parental_education = random.choice(['High School', 'College']) if target_score < 50 else random.choice(['High School', 'College', 'Postgraduate'])
    distance_from_home = random.choice(['Far', 'Moderate', 'Near'])
    gender = random.choice(['Male', 'Female'])
    
    return {
        'Hours_Studied': hours_studied,
        'Attendance': attendance,
        'Parental_Involvement': parental_involvement,
        'Access_to_Resources': access_resources,
        'Extracurricular_Activities': extracurricular,
        'Sleep_Hours': sleep_hours,
        'Previous_Scores': previous_scores,
        'Motivation_Level': motivation,
        'Internet_Access': internet_access,
        'Tutoring_Sessions': tutoring,
        'Family_Income': family_income,
        'Teacher_Quality': teacher_quality,
        'School_Type': random.choice(SCHOOL_TYPE),
        'Peer_Influence': peer_influence,
        'Physical_Activity': physical_activity,
        'Learning_Disabilities': learning_disabilities,
        'Parental_Education_Level': parental_education,
        'Distance_from_Home': distance_from_home,
        'Gender': gender,
        'Exam_Score': target_score
    }

def main():
    print("=" * 60)
    print("ADICIONANDO CASOS COM BAIXO DESEMPENHO AO DATASET")
    print("=" * 60)
    
    # Carregar dataset existente
    try:
        df = pd.read_csv(DATASET_PATH)
        print(f"✅ Dataset carregado: {len(df)} registros")
    except FileNotFoundError:
        print(f"❌ Erro: Dataset não encontrado em {DATASET_PATH}")
        return
    
    # Estatísticas atuais
    print(f"\n📊 Estatísticas atuais:")
    print(f"   Total de registros: {len(df)}")
    print(f"   Notas < 60: {(df['Exam_Score'] < 60).sum()} ({(df['Exam_Score'] < 60).sum() / len(df) * 100:.1f}%)")
    print(f"   Notas < 55: {(df['Exam_Score'] < 55).sum()} ({(df['Exam_Score'] < 55).sum() / len(df) * 100:.1f}%)")
    print(f"   Notas < 50: {(df['Exam_Score'] < 50).sum()} ({(df['Exam_Score'] < 50).sum() / len(df) * 100:.1f}%)")
    
    # Gerar novos casos com baixo desempenho
    # Meta: ter pelo menos 15-20% de casos com notas < 60
    target_low_cases = int(len(df) * 0.15)  # 15% do dataset
    current_low_cases = (df['Exam_Score'] < 60).sum()
    cases_to_add = max(0, target_low_cases - current_low_cases)
    
    print(f"\n🎯 Meta: {target_low_cases} casos com notas < 60")
    print(f"📊 Atual: {current_low_cases} casos")
    print(f"➕ Adicionando: {cases_to_add} novos casos")
    
    # Gerar casos com distribuição variada de notas baixas
    new_cases = []
    
    # 30% casos muito baixos (30-44)
    very_low_count = int(cases_to_add * 0.3)
    for _ in range(very_low_count):
        score = random.randint(30, 44)
        new_cases.append(generate_low_performance_case(score))
    
    # 40% casos baixos (45-54)
    low_count = int(cases_to_add * 0.4)
    for _ in range(low_count):
        score = random.randint(45, 54)
        new_cases.append(generate_low_performance_case(score))
    
    # 30% casos médio-baixos (55-59)
    medium_low_count = cases_to_add - very_low_count - low_count
    for _ in range(medium_low_count):
        score = random.randint(55, 59)
        new_cases.append(generate_low_performance_case(score))
    
    # Criar DataFrame com novos casos
    df_new = pd.DataFrame(new_cases)
    
    # Combinar com dataset existente
    df_combined = pd.concat([df, df_new], ignore_index=True)
    
    # Embaralhar para evitar viés
    df_combined = df_combined.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Salvar dataset atualizado
    df_combined.to_csv(OUTPUT_PATH, index=False)
    
    # Estatísticas finais
    print(f"\n✅ Dataset atualizado salvo em: {OUTPUT_PATH}")
    print(f"\n📊 Estatísticas finais:")
    print(f"   Total de registros: {len(df_combined)}")
    print(f"   Notas < 60: {(df_combined['Exam_Score'] < 60).sum()} ({(df_combined['Exam_Score'] < 60).sum() / len(df_combined) * 100:.1f}%)")
    print(f"   Notas < 55: {(df_combined['Exam_Score'] < 55).sum()} ({(df_combined['Exam_Score'] < 55).sum() / len(df_combined) * 100:.1f}%)")
    print(f"   Notas < 50: {(df_combined['Exam_Score'] < 50).sum()} ({(df_combined['Exam_Score'] < 50).sum() / len(df_combined) * 100:.1f}%)")
    print(f"   Notas < 45: {(df_combined['Exam_Score'] < 45).sum()} ({(df_combined['Exam_Score'] < 45).sum() / len(df_combined) * 100:.1f}%)")
    
    print("\n" + "=" * 60)
    print("✅ PROCESSO CONCLUÍDO COM SUCESSO!")
    print("=" * 60)
    print("\n💡 Próximos passos:")
    print("   1. Retreine o modelo com: py train_performance_regression.py")
    print("   2. O modelo deve aprender melhor padrões de baixo desempenho")

if __name__ == "__main__":
    main()


