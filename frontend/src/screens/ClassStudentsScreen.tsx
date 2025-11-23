import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../components/Card';
import Section from '../components/Section';
import StudentListItem from '../components/StudentListItem';
import { RootStackParamList } from '../navigation';
import colors from '../theme/colors';
import { getStudentsByClass, Student } from '../service/studentService';
import {
  connectSocket,
  disconnectSocket,
  subscribeToDiscipline,
  unsubscribeFromDiscipline,
  onPredictionCreated,
  offPredictionCreated,
  PredictionCreatedEvent,
} from '../service/socketService';

type ClassStudentsRouteProp = RouteProp<RootStackParamList, 'ClassStudents'>;
type ClassStudentsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ClassStudents'
>;

export default function ClassStudentsScreen() {
  const route = useRoute<ClassStudentsRouteProp>();
  const navigation = useNavigation<ClassStudentsNavigationProp>();
  const { subjectId, subjectName } = route.params;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar alunos
  const loadStudents = useCallback(async () => {
    try {
      setError(null);
      const data = await getStudentsByClass(subjectId);
      setStudents(data);
    } catch (err: any) {
      console.error('Erro ao carregar alunos:', err);
      setError(err.message || 'Erro ao carregar alunos');
      Alert.alert('Erro', err.message || 'Erro ao carregar alunos da turma');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [subjectId]);

  // Ref para timeout de debounce
  const reloadTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Função para recarregar após evento WebSocket (com debounce)
  const handlePredictionCreated = useCallback(
    async (event: PredictionCreatedEvent) => {
      // Verificar se o evento é da disciplina atual
      if (event.IDDisciplina === subjectId) {
        // Limpar timeout anterior se existir (debounce)
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
        }
        // Recarregar lista após um pequeno delay para garantir que o banco foi atualizado
        reloadTimeoutRef.current = setTimeout(() => {
          loadStudents();
          reloadTimeoutRef.current = null;
        }, 500);
      }
    },
    [subjectId, loadStudents]
  );

  // Configurar WebSocket
  useEffect(() => {
    let isMounted = true;
    let socketSetupAttempted = false;

    const setupWebSocket = async () => {
      // ✅ Evitar múltiplas tentativas
      if (socketSetupAttempted) return;
      socketSetupAttempted = true;

      try {
        // Conectar ao WebSocket (não bloqueia se falhar)
        await connectSocket();

        // Inscrever-se na disciplina
        await subscribeToDiscipline(subjectId);

        // Escutar eventos de predições criadas
        await onPredictionCreated(handlePredictionCreated);

        if (!isMounted) return;
      } catch (err) {
        // ✅ Silenciosamente ignorar - WebSocket é opcional
        // Não logar erro para não poluir o console
      }
    };

    // ✅ Executar de forma assíncrona sem bloquear
    setupWebSocket().catch(() => {
      // Silenciosamente ignorar
    });

    return () => {
      isMounted = false;
      socketSetupAttempted = false;
      // Limpar timeout se existir
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
      // Limpar listeners
      offPredictionCreated();
      // Cancelar inscrição (silenciosamente)
      unsubscribeFromDiscipline(subjectId).catch(() => {
        // Ignorar erros
      });
    };
  }, [subjectId, handlePredictionCreated]);

  // Carregar dados iniciais
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Atualizar título da tela
  useEffect(() => {
    if (subjectName) {
      navigation.setOptions({
        title: subjectName,
      });
    }
  }, [subjectName, navigation]);

  // Função de refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStudents();
  }, [loadStudents]);

  // Renderizar item da lista
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Student>) => {
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
          <StudentListItem 
            student={item} 
            onAddNota={(studentId, studentName) => {
              navigation.navigate('AddNota', {
                studentId,
                subjectId,
                studentName,
                subjectName,
              });
            }}
          />
          {!isLast && <View style={styles.innerSeparator} />}
        </View>
      );
    },
    [students.length, navigation, subjectId, subjectName]
  );

  // Header da lista
  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Section title={`Alunos da Turma (${students.length})`}>
          <Card>
            <Text style={styles.headerText}>
              Lista de todos os alunos com suas notas previstas e riscos de
              evasão.
            </Text>
          </Card>
        </Section>
      </View>
    ),
    [students.length]
  );

  // Empty state
  const EmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum aluno encontrado</Text>
        <Text style={styles.emptySubtext}>
          Esta turma ainda não possui alunos matriculados.
        </Text>
      </View>
    ),
    []
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando alunos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        initialNumToRender={10}
        windowSize={10}
        removeClippedSubviews
        maxToRenderPerBatch={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  header: {
    gap: 16,
    marginBottom: 16,
  },
  headerText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  rowContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 4,
  },
  innerSeparator: {
    height: 1,
    backgroundColor: colors.bg,
    marginHorizontal: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});

