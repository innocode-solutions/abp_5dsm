import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { getStudentIdByUserId, getStudentDetails, StudentDetails } from '../service/studentService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SelectSubject'>;

export default function SelectSubjectScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matriculas, setMatriculas] = useState<StudentDetails['matriculas']>([]);
  
  // Obter parâmetros da rota
  const returnTo = (route.params as any)?.returnTo || 'Habits';
  const customTitle = (route.params as any)?.title;
  const customSubtitle = (route.params as any)?.subtitle;

  useEffect(() => {
    loadMatriculas();
  }, []);

  const loadMatriculas = async () => {
    try {
      if (!user?.IDUser) return;

      const studentId = await getStudentIdByUserId();
      if (!studentId) {
        setLoading(false);
        return;
      }

      const studentData = await getStudentDetails(studentId);
      
      // Filtrar apenas matrículas ativas (se Status estiver disponível)
      // Se não tiver Status, mostrar todas as matrículas
      const matriculasAtivas = studentData.matriculas.filter(
        (m) => !m.Status || m.Status === 'ENROLLED'
      );

      setMatriculas(matriculasAtivas);
    } catch (error) {
      console.error('Erro ao carregar matrículas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = (matricula: StudentDetails['matriculas'][0]) => {
    // Navegar para a tela apropriada com a matéria selecionada
    if (returnTo === 'Engagement') {
      navigation.navigate('Engagement', {
        selectedMatriculaId: matricula.IDMatricula,
        selectedDisciplina: matricula.disciplina.NomeDaDisciplina,
      });
    } else {
      // Padrão: navegar para Habits (desempenho)
      navigation.navigate('Habits', {
        selectedMatriculaId: matricula.IDMatricula,
        selectedDisciplina: matricula.disciplina.NomeDaDisciplina,
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando matérias...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matriculas.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Feather name="book-open" size={64} color={colors.muted} />
          <Text style={styles.emptyTitle}>Nenhuma matéria encontrada</Text>
          <Text style={styles.emptyText}>
            Você não possui matrículas ativas no momento.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{customTitle || 'Selecione a Matéria'}</Text>
          <Text style={styles.subtitle}>
            {customSubtitle || (returnTo === 'Engagement' 
              ? 'Escolha a matéria para calcular o risco de evasão'
              : 'Escolha a matéria para calcular o desempenho')}
          </Text>
        </View>

        <View style={styles.subjectsList}>
          {matriculas.map((matricula) => {
            // Verificar predição baseado no tipo de retorno
            const predictionType = returnTo === 'Engagement' ? 'EVASAO' : 'DESEMPENHO';
            const hasPrediction = matricula.predictions?.some(
              (p) => p.TipoPredicao === predictionType
            );

            return (
              <TouchableOpacity
                key={matricula.IDMatricula}
                style={styles.subjectCard}
                onPress={() => handleSelectSubject(matricula)}
                activeOpacity={0.7}
              >
                <View style={styles.subjectIconContainer}>
                  <Feather name="book" size={24} color={colors.primary} />
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>
                    {matricula.disciplina.NomeDaDisciplina}
                  </Text>
                  {matricula.disciplina.CodigoDaDisciplina && (
                    <Text style={styles.subjectCode}>
                      {matricula.disciplina.CodigoDaDisciplina}
                    </Text>
                  )}
                  <Text style={styles.subjectPeriod}>
                    Período: {matricula.periodo.Nome}
                  </Text>
                  {hasPrediction && (
                    <View style={styles.predictionBadge}>
                      <Feather name="check-circle" size={14} color="#4CAF50" />
                      <Text style={styles.predictionText}>
                        Já possui predição
                      </Text>
                    </View>
                  )}
                </View>
                <Feather name="chevron-right" size={24} color={colors.muted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.muted,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  subjectsList: {
    gap: 12,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  subjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  subjectPeriod: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  predictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  predictionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

