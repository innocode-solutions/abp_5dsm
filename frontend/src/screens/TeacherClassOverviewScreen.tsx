import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { apiConnection } from '../api/apiConnection';

type Props = NativeStackScreenProps<RootStackParamList, keyof RootStackParamList>;

type ClassStudent = {
  id: string;
  name: string;
  email?: string;
  performance_score?: number;   // ex: média numérica
  dropout_risk?: 'baixo' | 'médio' | 'alto' | string;
};

export default function TeacherClassOverviewScreen({ route }: Props) {
  const { subjectId, subjectName } = route.params ?? ({} as { subjectId: string; subjectName?: string });
  const { user } = useAuth(); // se quiser mostrar "Professor(a) Fulano" no header ou no futuro
  const navigation = useNavigation();

  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [filtered, setFiltered] = useState<ClassStudent[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
  setError(null);
  setLoading(true);
  try {
    // Se o apiConnection já injeta Authorization, não precisamos de header aqui
    const res = await apiConnection.get<ClassStudent[]>(`/students/class/${subjectId}`);

    setStudents(res.data);
    setFiltered(res.data);
  } catch (err) {
    console.error('Erro ao buscar alunos da turma:', err);
    setError('Não foi possível carregar os alunos. Tente novamente mais tarde.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [subjectId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(students);
      return;
    }

    const lower = text.toLowerCase();
    setFiltered(
      students.filter((s) =>
        s.name.toLowerCase().includes(lower),
      ),
    );
  };

  // --------- Métricas agregadas ---------
  const { averageScore, totalStudents, dropoutRiskPercent } = useMemo(() => {
    const total = students.length;
    if (!total) {
      return {
        averageScore: 0,
        totalStudents: 0,
        dropoutRiskPercent: 0,
      };
    }

    const scoreSum = students.reduce(
      (sum, s) => sum + (s.performance_score ?? 0),
      0,
    );
    const avg = scoreSum / total;

    const riskCount = students.filter(
      (s) =>
        s.dropout_risk === 'médio' ||
        s.dropout_risk === 'alto',
    ).length;

    const riskPercent = (riskCount / total) * 100;

    return {
      averageScore: avg,
      totalStudents: total,
      dropoutRiskPercent: riskPercent,
    };
  }, [students]);

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'alto':
        return '#DC2626'; // vermelho
      case 'médio':
        return '#F59E0B'; // amarelo
      case 'baixo':
        return '#16A34A'; // verde
      default:
        return colors.muted;
    }
  };

  const renderStudent = ({ item }: { item: ClassStudent }) => (
    <TouchableOpacity
      style={styles.studentCard}
      activeOpacity={0.8}
      // 🔜 No futuro, aqui podemos navegar para a tela 3 (TeacherStudentPerformance)
      // onPress={() => navigation.navigate('TeacherStudentPerformance', { studentId: item.id, subjectId })}
    >
      {/* Avatar simples com inicial do nome */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </View>

      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.studentMetaContainer}>
          <Text
            style={[
              styles.studentRiskBadge,
              { color: getRiskColor(item.dropout_risk) },
            ]}
          >
            {item.dropout_risk
              ? `${item.dropout_risk.charAt(0).toUpperCase() + item.dropout_risk.slice(1)} risco`
              : 'Não calculado'}
          </Text>
          <Text style={styles.studentAverage}>
            Média: {item.performance_score != null
              ? item.performance_score.toFixed(1)
              : '--'}
          </Text>
        </View>
      </View>

      <Feather name="chevron-right" size={18} color={colors.muted} />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando dados da turma...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER COM [PROF] */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          [PROF] Acompanhamento da Turma
        </Text>
      </View>

      {/* TÍTULO DA SEÇÃO COM BOTÃO + */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Alunos</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.7}
          // 🔜 No futuro, aqui podemos adicionar funcionalidade de adicionar aluno
        >
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* CAMPO DE BUSCA */}
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={18}
          color={colors.muted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Buscar aluno"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={handleSearch}
          style={styles.searchInput}
        />
      </View>

      {/* VISÃO GERAL */}
      <View style={styles.overviewSection}>
        <Text style={styles.overviewTitle}>Visão Geral</Text>
        <View style={styles.cardsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Média da Turma</Text>
            <Text style={styles.metricValue}>
              {averageScore.toFixed(1)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Risco de Evasão</Text>
            <Text style={styles.metricValue}>
              {dropoutRiskPercent.toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.metricLabel}>Total de Alunos</Text>
            <Text style={styles.metricValue}>{totalStudents}</Text>
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* LISTA DE ALUNOS */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerStyle={
          filtered.length === 0
            ? styles.emptyListContainer
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.emptyText}>
              Nenhum aluno encontrado para esta turma.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary ?? '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  studentMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentRiskBadge: {
    fontSize: 13,
    fontWeight: '500',
  },
  studentAverage: {
    fontSize: 13,
    color: colors.text,
  },
  emptyListContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
  },
});
