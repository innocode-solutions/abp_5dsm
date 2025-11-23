import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { courseService, Course } from '../service/courseService';
import CourseCard from '../components/CourseCard';
import CourseModal from '../components/CourseModal';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

export default function CoursesIESScreen() {
  const navigation = useNavigation<any>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAll(1, 100, search); // Fetching up to 100 for now
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [search])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setModalVisible(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setModalVisible(true);
  };

  const handleSaveCourse = async (data: { NomeDoCurso: string; Descricao?: string }) => {
    try {
      if (selectedCourse) {
        await courseService.update(selectedCourse.IDCurso, data);
      } else {
        await courseService.create(data);
      }
      fetchCourses(); // Refresh list
    } catch (error) {
      console.error('Error saving course:', error);
      throw error; // Re-throw to let Modal handle error display
    }
  };

  const handleDeleteCourse = (course: Course) => {
    Alert.alert(
      'Excluir Curso',
      `Tem certeza que deseja excluir o curso "${course.NomeDoCurso}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await courseService.delete(course.IDCurso);
              fetchCourses(); // Refresh list
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Erro', 'Não foi possível excluir o curso. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cursos</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Cursos Existentes</Text>

        <View style={styles.listContainer}>
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={courses}
              keyExtractor={(item) => item.IDCurso}
              renderItem={({ item }) => (
                <CourseCard
                  title={item.NomeDoCurso}
                  description={item.Descricao}
                  onEdit={() => handleEditCourse(item)}
                  onDelete={() => handleDeleteCourse(item)}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhum curso encontrado.</Text>
              }
            />
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Nome do Curso"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
            <Feather name="plus" size={24} color="#fff" style={styles.addIcon} />
            <Text style={styles.addButtonText}>Adicionar Curso</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CourseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveCourse}
        initialData={selectedCourse}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100, // Space for footer
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent', // Or gradient if needed, but design shows inputs floating or at bottom
  },
  searchContainer: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  addButton: {
    backgroundColor: '#4A90E2', // Blue color from design
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
