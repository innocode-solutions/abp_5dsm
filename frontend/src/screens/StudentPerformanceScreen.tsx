import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { getStudentDetails, StudentDetails } from '../service/studentService';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentPerformance'>;

interface SubjectGrade {
  disciplina: string;
  nota: number;
  risco?: string;
}

export default function StudentPerformanceScreen({ route }: Props) {
  const { studentId, studentName, subjectId } = route.params;
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudentData = useCallback(async () => {
    try {
      setError(null);
      const data = await getStudentDetails(studentId);
      setStudent(data);
    } catch (err: any) {
      console.error('Erro ao carregar dados do aluno:', err);
      setError(err.message || 'Erro ao carregar dados do aluno');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentData();
  };

  // Calcular notas por disciplina
  const subjectGrades: SubjectGrade[] = student?.matriculas
    .map((matricula) => {
      // Buscar predição de desempenho para esta matrícula
      const performancePred = matricula.predictions?.find(
        (p) => p.TipoPredicao === 'DESEMPENHO'
      );
      const dropoutPred = matricula.predictions?.find(
        (p) => p.TipoPredicao === 'EVASAO'
      );

      const nota = performancePred
        ? Math.round(performancePred.Probabilidade * 1000) / 10
        : 0;

      // Determinar risco de evasão
      let risco: string | undefined;
      if (dropoutPred) {
        const prob = dropoutPred.Probabilidade;
        if (prob < 0.33) risco = 'baixo';
        else if (prob < 0.66) risco = 'médio';
        else risco = 'alto';
      }

      return {
        disciplina: matricula.disciplina.NomeDaDisciplina,
        nota,
        risco,
      };
    })
    .filter((sg) => sg.nota > 0) || [];

  // Calcular frequência geral (mock por enquanto, pode ser adicionado ao backend)
  const attendance = 95; // TODO: buscar do backend

  // Ícones por tipo de disciplina
  const getSubjectIcon = (disciplina: string) => {
    if (disciplina.toLowerCase().includes('máquina') || disciplina.toLowerCase().includes('machine')) {
      return 'book-open';
    }
    if (disciplina.toLowerCase().includes('segurança') || disciplina.toLowerCase().includes('security')) {
      return 'shield-check';
    }
    if (disciplina.toLowerCase().includes('nuvem') || disciplina.toLowerCase().includes('cloud')) {
      return 'cloud';
    }
    return 'book';
  };

  const getRiskColor = (risco?: string) => {
    switch (risco) {
      case 'alto':
        return '#DC2626';
      case 'médio':
        return '#F59E0B';
      case 'baixo':
        return '#16A34A';
      default:
        return colors.muted;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando dados do aluno...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !student) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error || 'Aluno não encontrado'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header com foto e nome */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {student.Nome?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.studentName}>{student.Nome}</Text>
          {student.Matricula && (
            <Text style={styles.matricula}>
              Matrícula: {student.Matricula}
            </Text>
          )}
        </View>

        {/* Seção de Notas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          {subjectGrades.length > 0 ? (
            subjectGrades.map((item, index) => (
              <View key={index} style={styles.subjectRow}>
                <Feather
                  name={getSubjectIcon(item.disciplina) as any}
                  size={20}
                  color={colors.primary}
                  style={styles.subjectIcon}
                />
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{item.disciplina}</Text>
                  <Text style={styles.subjectGrade}>
                    Nota: {item.nota.toFixed(1)}
                  </Text>
                </View>
                {item.risco && (
                  <View
                    style={[
                      styles.riskBadge,
                      { backgroundColor: getRiskColor(item.risco) + '20' },
                    ]}
                  >
                    <Text
                      style={[styles.riskText, { color: getRiskColor(item.risco) }]}
                    >
                      {item.risco.charAt(0).toUpperCase() + item.risco.slice(1)} risco
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Nenhuma nota disponível ainda.
            </Text>
          )}
        </View>

        {/* Seção de Frequência */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequência</Text>
          <View style={styles.attendanceRow}>
            <Feather name="calendar" size={20} color={colors.primary} />
            <View style={styles.attendanceInfo}>
              <Text style={styles.attendanceLabel}>Frequência Geral</Text>
              <Text style={styles.attendanceValue}>
                Presença: {attendance}%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  studentName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  matricula: {
    fontSize: 14,
    color: colors.muted,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  subjectIcon: {
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  subjectGrade: {
    fontSize: 14,
    color: colors.muted,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  attendanceLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  attendanceValue: {
    fontSize: 14,
    color: colors.muted,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    fontStyle: 'italic',
  },
});
