import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../components/Card';
import Section from '../components/Section';
import StudentItem from '../components/StudentItem';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getProfessorDashboard, Discipline, ProfessorDashboard } from '../service/dashboardService';
import { RootStackParamList } from '../navigation';

type DashboardScreenProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

type Student = {
  id: string;
  name: string;
  course: string;
  avatar: string;
};

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenProp>();
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loadingDisciplines, setLoadingDisciplines] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    overview: { ativos: number; inativos: number; total: number };
    evasao: { taxa: string };
    students: Student[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do dashboard
  useEffect(() => {
    if (user?.IDUser && (user.Role === 'TEACHER' || user.Role === 'ADMIN')) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.IDUser) return;
    
    try {
      setLoading(true);
      const dashboard = await getProfessorDashboard(user.IDUser);
      setDisciplines(dashboard.disciplinas || []);
      
      // Calcular overview
      const totalAlunos = dashboard.totalAlunos || 0;
      const alunosAtivos = dashboard.alunos.filter(a => a.status === 'ENROLLED' || a.status === 'COMPLETED').length;
      const alunosInativos = totalAlunos - alunosAtivos;
      
      // Calcular taxa de evasão
      const taxaEvasao = dashboard.metricas.percentualRiscoAltoEvasao || 0;
      
      // Alunos em risco (alto risco de evasão)
      const alunosRisco = dashboard.alunos
        .filter(a => {
          const riscoEvasao = a.predicoes.evasao;
          if (!riscoEvasao) return false;
          const prob = riscoEvasao.probabilidade;
          return prob >= 0.66; // Alto risco
        })
        .slice(0, 6)
        .map(a => ({
          id: a.id,
          name: a.nome,
          course: a.disciplina.nome,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.nome)}&background=random`,
        }));
      
      setDashboardData({
        overview: {
          ativos: alunosAtivos,
          inativos: alunosInativos,
          total: totalAlunos,
        },
        evasao: {
          taxa: `${taxaEvasao.toFixed(1)}%`,
        },
        students: alunosRisco,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Em caso de erro, usar valores padrão
      setDashboardData({
        overview: { ativos: 0, inativos: 0, total: 0 },
        evasao: { taxa: '0%' },
        students: [],
      });
    } finally {
      setLoading(false);
      setLoadingDisciplines(false);
    }
  };

  const handleDisciplinePress = useCallback((discipline: Discipline) => {
    navigation.navigate('ClassStudents', {
      subjectId: discipline.IDDisciplina,
      subjectName: discipline.NomeDaDisciplina,
    });
  }, [navigation]);

  const ListHeader = useMemo(
    () => (
      <View style={{ gap: 20 }}>
        <Section title="Visão Geral dos Alunos">
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : (
            <>
              <View style={styles.grid}>
                <Card>
                  <Text style={styles.cardLabel}>Ativos</Text>
                  <Text style={styles.cardValue}>{dashboardData?.overview.ativos ?? 0}</Text>
                </Card>
                <Card>
                  <Text style={styles.cardLabel}>Inativos</Text>
                  <Text style={styles.cardValue}>{dashboardData?.overview.inativos ?? 0}</Text>
                </Card>
              </View>

              <Card style={{ marginTop: 12 }}>
                <Text style={styles.cardLabel}>Total</Text>
                <Text style={styles.totalValue}>{dashboardData?.overview.total ?? 0}</Text>
              </Card>
            </>
          )}
        </Section>

        <Section title="Indicadores de Evasão">
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : (
            <Card>
              <Text style={styles.cardLabel}>Taxa de Evasão</Text>
              <Text style={styles.cardValue}>{dashboardData?.evasao.taxa ?? '0%'}</Text>
            </Card>
          )}
        </Section>

        {/* Novo botão para acessar a tela de Performance da Turma */}
        <Section title="Performance da Turma">
          <TouchableOpacity
            style={[styles.rowContainer, { alignItems: 'center', justifyContent: 'center' }]}
            onPress={() => navigation.navigate('ClassPerformance' as never)}
          >
            <Text style={{ fontWeight: '600', color: colors.text }}>Ver Desempenho Completo da Turma</Text>
          </TouchableOpacity>
        </Section>

        {/* Seção de Disciplinas/Turmas */}
        <Section title="Minhas Turmas">
          {loadingDisciplines ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando turmas...</Text>
            </View>
          ) : disciplines.length > 0 ? (
            disciplines.map((discipline, index) => (
              <TouchableOpacity
                key={discipline.IDDisciplina}
                style={[
                  styles.disciplineCard,
                  index === 0 && styles.disciplineCardFirst,
                  index === disciplines.length - 1 && styles.disciplineCardLast,
                ]}
                onPress={() => handleDisciplinePress(discipline)}
              >
                <View style={styles.disciplineInfo}>
                  <Text style={styles.disciplineName}>{discipline.NomeDaDisciplina}</Text>
                  {discipline.CodigoDaDisciplina && (
                    <Text style={styles.disciplineCode}>{discipline.CodigoDaDisciplina}</Text>
                  )}
                </View>
                <Text style={styles.disciplineArrow}>→</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Card>
              <Text style={styles.emptyText}>Nenhuma turma encontrada</Text>
            </Card>
          )}
        </Section>

        <Section title="Alunos em Risco" />
      </View>
    ),
    [disciplines, loadingDisciplines, handleDisciplinePress, navigation]
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<Student>) => {
    const students = dashboardData?.students ?? [];
    const isFirst = index === 0;
    const isLast = index === students.length - 1;

    return (
      <View
        style={[
          styles.rowContainer,
          isFirst && styles.rowFirst,
          isLast && styles.rowLast,
        ]}
      >
        <StudentItem name={item.name} course={item.course} avatar={item.avatar} />
        {!isLast && <View style={styles.innerSeparator} />}
      </View>
    );
  };

  const students = dashboardData?.students ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.container}
        initialNumToRender={8}
        windowSize={10}
        removeClippedSubviews
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum aluno em risco encontrado</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', gap: 12 },
  cardLabel: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  cardValue: { color: colors.text, fontSize: 20, fontWeight: '600' },
  totalValue: { color: colors.text, fontSize: 28, fontWeight: '700' },
  rowContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    paddingVertical: 12,
  },
  rowFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  rowLast: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginBottom: 4 },
  innerSeparator: { height: 10, backgroundColor: 'transparent' },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  disciplineCard: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  disciplineCardFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  disciplineCardLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 0,
  },
  disciplineInfo: {
    flex: 1,
  },
  disciplineName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  disciplineCode: {
    fontSize: 13,
    color: colors.muted,
  },
  disciplineArrow: {
    fontSize: 20,
    color: colors.primary,
    marginLeft: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
