import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getTeacherClasses, Class, createClass, CreateClassData } from '../service/classService';
import ClassListItem from '../components/ClassListItem';
import ClassModal from '../components/ClassModal';
import { RootStackParamList, RootTabParamList } from '../navigation';

// Tipo combinado para permitir navegação tanto no Tab quanto no Stack
type ClassesScreenProp = BottomTabNavigationProp<RootTabParamList, 'Turmas'> &
  NativeStackNavigationProp<RootStackParamList>;

export default function ClassesTeacherScreen() {
  const navigation = useNavigation<ClassesScreenProp>();
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  // Função de logout separada (similar ao SettingsScreen)
  const performLogout = async () => {
    try {
      await logout();
      
      // ✅ Na web, forçar navegação imediatamente
      if (Platform.OS === 'web') {
        // Usar requestAnimationFrame para garantir que o estado foi atualizado
        requestAnimationFrame(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        });
      }
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
      if (Platform.OS !== 'web') {
        Alert.alert('Erro', 'Não foi possível fazer logout');
      } else {
        alert('Erro: Não foi possível fazer logout');
      }
    }
  };

  // Adicionar no useEffect para configurar o header
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={async () => {
            // ✅ Na web, usar window.confirm
            if (Platform.OS === 'web') {
              const confirmed = window.confirm('Tem certeza que deseja sair?');
              if (confirmed) {
                await performLogout();
              }
            } else {
              Alert.alert(
                'Sair',
                'Tem certeza que deseja sair?',
                [
                  {
                    text: 'Cancelar',
                    style: 'cancel',
                  },
                  {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: performLogout,
                  },
                ]
              );
            }
          }}
          style={{ marginLeft: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Sair"
        >
          <Feather name="log-out" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            setModalVisible(true);
          }}
          style={{ marginRight: 16 }}
        >
          <Feather name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]); // ✅ Adicionar logout nas dependências

  // Função para salvar nova turma
  const handleSaveClass = useCallback(async (data: CreateClassData) => {
    try {
      await createClass(data);
      // Recarregar a lista de turmas
      await loadClasses();
      Alert.alert('Sucesso', 'Turma cadastrada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar turma:', err);
      throw err; // Re-throw para o modal tratar
    }
  }, [loadClasses]);

  // Função de refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Recarregar turmas primeiro
      await loadClasses();
      // Se houver turma selecionada, recarregar alunos também
      // if (selectedClassId) { // selectedClassId is not defined in this file
      //   await fetchStudents();
      // }
    } catch (err) {
      console.error('Erro ao recarregar:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadClasses]);

  // Handler para pressionar uma turma
  const handleClassPress = useCallback(
    (classItem: Class) => {
      
      try {
        // Método 1: Tentar usar getParent() e navigate
        const parentNavigation = navigation.getParent();
        
        if (parentNavigation) {
          (parentNavigation as NativeStackNavigationProp<RootStackParamList>).navigate('ClassStudents', {
            subjectId: classItem.IDDisciplina,
            subjectName: classItem.NomeDaDisciplina,
          });
          return;
        }

        // Método 2: Usar CommonActions para navegar no Stack root
        navigation.dispatch(
          CommonActions.navigate({
            name: 'ClassStudents',
            params: {
              subjectId: classItem.IDDisciplina,
              subjectName: classItem.NomeDaDisciplina,
            },
          })
        );
      } catch (error: any) {
        console.error('Erro ao navegar');
        Alert.alert('Erro', `Não foi possível abrir a turma: ${error.message || 'Erro desconhecido'}`);
      }
    },
    [navigation],
  );

  // Renderizar item da lista
  const renderItem = useCallback(
    ({ item }: { item: Class }) => (
      <ClassListItem classItem={item} onPress={() => handleClassPress(item)} />
    ),
    [handleClassPress],
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
    [],
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
      <ClassModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveClass}
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
