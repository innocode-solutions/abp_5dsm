import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { getTeacherClasses, Class } from '../service/classService';
import { getStudentsByClass, Student } from '../service/studentService'; // ✅ Importar o serviço
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

// ✅ Usar o tipo Student do serviço em vez de ClassStudent
export default function TeacherStudentsScreen() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]); // ✅ Usar tipo Student
  const [filtered, setFiltered] = useState<Student[]>([]); // ✅ Usar tipo Student
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Carregar turmas
  const loadClasses = useCallback(async () => {
    if (!user?.IDUser) {
      setLoading(false);
      return;
    }

    try {
      const data = await getTeacherClasses(user.IDUser);
      setClasses(data);
      
      // Selecionar primeira turma automaticamente se houver
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].IDDisciplina);
      }
    } catch (err: any) {
      console.error('Erro ao carregar turmas:', err);
      setError(err.message || 'Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  }, [user?.IDUser, selectedClassId]);

  // ✅ Carregar alunos da turma selecionada usando o serviço correto
  const fetchStudents = useCallback(async () => {
    if (!selectedClassId) {
      setStudents([]);
      setFiltered([]);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // ✅ Usar o serviço getStudentsByClass em vez de chamada direta
      const data = await getStudentsByClass(selectedClassId);
      setStudents(data);
      setFiltered(data);
    } catch (err: any) {
      console.error('Erro ao buscar alunos da turma:', err);
      setError(err.message || 'Não foi possível carregar os alunos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    }
  }, [selectedClassId, fetchStudents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Recarregar turmas primeiro
      await loadClasses();
      // Se houver turma selecionada, recarregar alunos também
      if (selectedClassId) {
        await fetchStudents();
      }
    } catch (err) {
      console.error('Erro ao recarregar:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadClasses, fetchStudents, selectedClassId]);

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

  // Métricas agregadas
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

  const getRiskColor = (risk?: string | null) => { // ✅ Ajustar tipo para aceitar null
    switch (risk) {
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

  // ✅ Atualizar renderStudent para usar tipo Student
  const renderStudent = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={styles.studentCard}
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('StudentPerformance', {
          studentId: item.id,
          studentName: item.name,
          subjectId: selectedClassId || undefined,
        });
      }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </View>

      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.email && ( // ✅ Mostrar email se disponível
          <Text style={styles.studentEmail} numberOfLines={1}>
            {item.email}
          </Text>
        )}

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

  const selectedClass = classes.find(c => c.IDDisciplina === selectedClassId);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Seletor de turma */}
      {classes.length > 1 && (
        <View style={styles.classSelector}>
          <Text style={styles.selectorLabel}>Turma:</Text>
          <FlatList
            horizontal
            data={classes}
            keyExtractor={(item) => item.IDDisciplina}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.classButton,
                  selectedClassId === item.IDDisciplina && styles.classButtonActive,
                ]}
                onPress={() => setSelectedClassId(item.IDDisciplina)}
              >
                <Text
                  style={[
                    styles.classButtonText,
                    selectedClassId === item.IDDisciplina && styles.classButtonTextActive,
                  ]}
                >
                  {item.NomeDaDisciplina}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Título da seção */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alunos</Text>
        {selectedClass && (
          <Text style={styles.className}>{selectedClass.NomeDaDisciplina}</Text>
        )}
      </View>

      {/* Campo de busca */}
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

      {/* Visão geral */}
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

      {/* Lista de alunos */}
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
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  classSelector: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg,
    marginRight: 8,
  },
  classButtonActive: {
    backgroundColor: colors.primary,
  },
  classButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  classButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  className: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
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
  studentEmail: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
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