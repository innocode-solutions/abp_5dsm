import pandas as pd
#Buscar o csv.
df = pd.read_csv('datasets/StudentPerformanceFactors.csv')
print(df)
#Definir os valores que estão nulos com as colunas.
missing_values = df.isnull().sum()
print("Missing values per column:")
print(missing_values)

#Separar informações categoricas