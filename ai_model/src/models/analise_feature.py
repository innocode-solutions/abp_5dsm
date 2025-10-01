import pandas as pd

DATASET_PATH = '../datasets/StudentPerformanceFactors.csv'
NOTA_DE_CORTE = 68

df = pd.read_csv(DATASET_PATH)
df['Aprovado'] = (df['Exam_Score'] >= NOTA_DE_CORTE).astype(int)

# Vamos criar faixas de frequência para analisar
bins = [0, 70, 80, 90, 101]
labels = ['<70%', '70-80%', '80-90%', '>90%']
df['Faixa_Attendance'] = pd.cut(df['Attendance'], bins=bins, labels=labels, right=False)

# Calcula a taxa de aprovação para cada faixa
taxa_aprovacao_por_faixa = df.groupby('Faixa_Attendance')['Aprovado'].mean().reset_index()
taxa_aprovacao_por_faixa['Aprovado'] = (taxa_aprovacao_por_faixa['Aprovado'] * 100).round(2)

print("Taxa de Aprovação (%) por Faixa de Frequência (Attendance):")
print(taxa_aprovacao_por_faixa)
print("\nProporção geral de Aprovados vs. Reprovados:")
print(df['Aprovado'].value_counts(normalize=True) * 100)