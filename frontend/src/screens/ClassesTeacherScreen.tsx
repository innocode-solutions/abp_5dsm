import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getTeacherClasses, Class } from '../service/classService';
import ClassListItem from '../components/ClassListItem';
import { RootStackParamList } from '../navigation';

type ClassesScreenProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function ClassesScreen() {
  const navigation = useNavigation<ClassesScreenProp>();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar turmas
  const loadClasses = useCallback(async () => {
    if (!user?.IDUser) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getTeacherClasses(user.IDUser);
      setClasses(data);
    } catch (err: any) {
      console.error('Erro ao carregar turmas:', err);
      setError(err.message || 'Erro ao carregar turmas');
      if (!refreshing) {
        Alert.alert('Erro', err.message || 'Erro ao carregar turmas');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.IDUser, refreshing]);

  // Carregar dados iniciais
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Função de refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadClasses();
  }, [loadClasses]);

  // Handler para pressionar uma turma
  const handleClassPress = useCallback(
    (classItem: Class) => {
      navigation.navigate('ClassStudents', {
        subjectId: classItem.IDDisciplina,
        subjectName: classItem.NomeDaDisciplina,
      });
    },
    [navigation]
  );

  // Renderizar item da lista
  const renderItem = useCallback(
    ({ item }: { item: Class }) => (
      <ClassListItem classItem={item} onPress={() => handleClassPress(item)} />
    ),
    [handleClassPress]
  );

  // Empty state
  const EmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Feather name="book-open" size={64} color={colors.muted} />
        <Text style={styles.emptyText}>Nenhuma turma encontrada</Text>
        <Text style={styles.emptySubtext}>
          Você ainda não possui turmas cadastradas.
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
          <Text style={styles.loadingText}>Carregando turmas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.IDDisciplina}
        renderItem={renderItem}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});

