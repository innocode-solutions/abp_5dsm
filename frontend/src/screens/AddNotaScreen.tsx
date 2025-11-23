import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { RootStackParamList } from '../navigation';
import { notaService, CreateNotaRequest } from '../service/notaService';
import { apiConnection } from '../api/apiConnection';
import { getToken } from '../service/tokenStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AddNota'>;

interface Matricula {
  IDMatricula: string;
  aluno: {
    IDAluno: string;
    Nome: string;
    Email: string;
  };
  disciplina: {
    IDDisciplina: string;
    NomeDaDisciplina: string;
  };
}

export default function AddNotaScreen({ route, navigation }: Props) {
  const { studentId, subjectId, studentName, subjectName } = route.params;
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [selectedMatricula, setSelectedMatricula] = useState<string>('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('P1');
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMatriculas, setLoadingMatriculas] = useState(true);

  useEffect(() => {
    loadMatriculas();
  }, [studentId, subjectId]);

  const loadMatriculas = async () => {
    try {
      setLoadingMatriculas(true);
      const token = await getToken();
      
      // Buscar matrículas do aluno na disciplina
      const response = await apiConnection.get<Matricula[]>(`/matriculas/aluno/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Filtrar apenas matrículas da disciplina atual
      const matriculasFiltradas = response.data.filter(
        (m: any) => m.disciplina?.IDDisciplina === subjectId
      );

      setMatriculas(matriculasFiltradas);
      
      // Selecionar automaticamente se houver apenas uma matrícula
      if (matriculasFiltradas.length === 1) {
        setSelectedMatricula(matriculasFiltradas[0].IDMatricula);
      }
    } catch (error: any) {
      console.error('Erro ao carregar matrículas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as matrículas do aluno.');
    } finally {
      setLoadingMatriculas(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMatricula) {
      Alert.alert('Atenção', 'Selecione uma matrícula.');
      return;
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum < 0 || valorNum > 100) {
      Alert.alert('Atenção', 'O valor da nota deve estar entre 0 e 100.');
      return;
    }

    setLoading(true);
    try {
      const notaData: CreateNotaRequest = {
        IDMatricula: selectedMatricula,
        Valor: valorNum,
        Tipo: tipo || undefined,
        DataAvaliacao: dataAvaliacao ? new Date(dataAvaliacao).toISOString() : undefined,
        Observacoes: observacoes || undefined,
      };

      await notaService.create(notaData);
      Alert.alert('Sucesso', 'Nota adicionada com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao criar nota:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao adicionar nota.';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingMatriculas) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matriculas.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>Nenhuma matrícula encontrada</Text>
          <Text style={styles.emptySubText}>
            O aluno não está matriculado nesta disciplina.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Adicionar Nota</Text>
          <Text style={styles.subtitle}>
            {studentName} - {subjectName}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Seleção de Matrícula */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Matrícula *</Text>
            {!selectedMatricula && <Text style={styles.placeholder}>Selecione uma matrícula</Text>}
            <View style={styles.pickerOptions}>
              {matriculas.map((mat) => (
                <TouchableOpacity
                  key={mat.IDMatricula}
                  style={[
                    styles.pickerOption,
                    selectedMatricula === mat.IDMatricula && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setSelectedMatricula(mat.IDMatricula)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedMatricula === mat.IDMatricula && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {mat.disciplina.NomeDaDisciplina} - {mat.aluno.Nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Valor da Nota */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Valor da Nota (0-100) *</Text>
            <TextInput
              style={styles.input}
              value={valor}
              onChangeText={setValor}
              keyboardType="numeric"
              placeholder="Ex: 85.5"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Tipo de Avaliação */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Tipo de Avaliação</Text>
            <View style={styles.pickerOptions}>
              {['P1', 'P2', 'P3', 'Trabalho', 'Prova Final', 'Atividade', 'Seminário', 'Outro'].map((tipoOption) => (
                <TouchableOpacity
                  key={tipoOption}
                  style={[
                    styles.pickerOption,
                    tipo === tipoOption && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setTipo(tipoOption)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      tipo === tipoOption && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {tipoOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Data da Avaliação */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Data da Avaliação</Text>
            <TextInput
              style={styles.input}
              value={dataAvaliacao}
              onChangeText={setDataAvaliacao}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Observações */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Observações sobre a nota..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="check" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Adicionar Nota</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  placeholder: {
    fontSize: 14,
    color: colors.muted || '#999',
    marginBottom: 8,
  },
  pickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  pickerOption: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    margin: 4,
  },
  pickerOptionSelected: {
    borderColor: colors.primary || '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.text || '#333',
  },
  pickerOptionTextSelected: {
    color: colors.primary || '#4A90E2',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary || '#4A90E2',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
    padding: 12,
    backgroundColor: colors.primary || '#4A90E2',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

