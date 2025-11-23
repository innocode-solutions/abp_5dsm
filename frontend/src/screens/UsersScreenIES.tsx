import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { userService, CreateUserResponse, UpdateUserRequest, Curso } from '../service/userService';
import UserListItem from '../components/UserListItem';

type UserRole = 'STUDENT' | 'TEACHER';

export default function UsersScreen() {
  const [users, setUsers] = useState<CreateUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CreateUserResponse | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Estados do formulário de edição
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [cursoSelecionado, setCursoSelecionado] = useState<Curso | null>(null);
  const [semestre, setSemestre] = useState('');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [modalCursoVisible, setModalCursoVisible] = useState(false);
  const [loadingCursos, setLoadingCursos] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar os usuários.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCursos = async () => {
    setLoadingCursos(true);
    try {
      const cursosData = await userService.getCursos();
      setCursos(cursosData);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar os cursos');
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoadingCursos(false);
    }
  };

  const handleEdit = async (user: CreateUserResponse) => {
    try {
      // Buscar dados completos do usuário
      const fullUser = await userService.getUserById(user.IDUser);
      setSelectedUser(fullUser);
      setNome(fullUser.name || '');
      setEmail(fullUser.Email);
      setRole(fullUser.Role as UserRole);

      // Se for aluno, carregar dados do aluno
      if (fullUser.Role === 'STUDENT' && fullUser.alunos && fullUser.alunos.length > 0) {
        const aluno = fullUser.alunos[0];
        setSemestre(aluno.Semestre.toString());
        if (aluno.curso) {
          setCursoSelecionado({
            IDCurso: aluno.curso.IDCurso,
            NomeDoCurso: aluno.curso.NomeDoCurso,
          });
        }
        await loadCursos();
      } else if (fullUser.Role === 'STUDENT') {
        await loadCursos();
      }

      setEditModalVisible(true);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do usuário');
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const handleDelete = (user: CreateUserResponse) => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir o usuário ${user.name || user.Email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(user.IDUser);
              await userService.deleteUser(user.IDUser);
              Alert.alert('Sucesso', 'Usuário excluído com sucesso!');
              await fetchUsers();
            } catch (error: any) {
              const errorMessage =
                error?.response?.data?.error ||
                error?.message ||
                'Erro ao excluir usuário';
              Alert.alert('Erro', errorMessage);
              console.error('Erro ao excluir usuário:', error);
            } finally {
              setDeleteLoading(null);
            }
          },
        },
      ]
    );
  };

  const validateEditForm = (): boolean => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Erro', 'E-mail é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'E-mail inválido');
      return false;
    }

    if (!role) {
      Alert.alert('Erro', 'Selecione o tipo de usuário');
      return false;
    }

    if (role === 'STUDENT') {
      if (!cursoSelecionado) {
        Alert.alert('Erro', 'Selecione o curso');
        return false;
      }

      if (!semestre.trim()) {
        Alert.alert('Erro', 'Semestre é obrigatório');
        return false;
      }

      const semestreNum = parseInt(semestre, 10);
      if (isNaN(semestreNum) || semestreNum < 1) {
        Alert.alert('Erro', 'Semestre deve ser um número válido');
        return false;
      }
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateEditForm() || !selectedUser) {
      return;
    }

    setEditLoading(true);
    try {
      const updateData: UpdateUserRequest = {
        Email: email.trim(),
        Role: role!,
        name: nome.trim(),
      };

      if (role === 'STUDENT') {
        updateData.alunoData = {
          Nome: nome.trim(),
          Semestre: parseInt(semestre, 10),
          IDCurso: cursoSelecionado!.IDCurso,
        };
      }

      await userService.updateUser(selectedUser.IDUser, updateData);
      Alert.alert('Sucesso', 'Usuário atualizado com sucesso!');
      setEditModalVisible(false);
      await fetchUsers();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Erro ao atualizar usuário';
      Alert.alert('Erro', errorMessage);
      console.error('Erro ao atualizar usuário:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedUser(null);
    setNome('');
    setEmail('');
    setRole(null);
    setCursoSelecionado(null);
    setSemestre('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Usuários</Text>
        <FlatList
          data={users}
          keyExtractor={(item) => item.IDUser}
          renderItem={({ item }) => (
            <UserListItem
              user={item}
              onEdit={handleEdit}
              onDelete={deleteLoading === item.IDUser ? undefined : handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
          }
          refreshing={loading}
          onRefresh={fetchUsers}
        />
      </View>

      {/* Modal de Edição */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Usuário</Text>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Campo Nome */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do usuário"
                  placeholderTextColor={colors.muted}
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                />
              </View>

              {/* Campo E-mail */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="E-mail do usuário"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Seleção de Role */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tipo de Usuário</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'STUDENT' && styles.roleButtonSelected,
                    ]}
                    onPress={() => {
                      setRole('STUDENT');
                      if (cursos.length === 0) {
                        loadCursos();
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'STUDENT' && styles.roleButtonTextSelected,
                      ]}
                    >
                      Aluno
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'TEACHER' && styles.roleButtonSelected,
                    ]}
                    onPress={() => setRole('TEACHER')}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'TEACHER' && styles.roleButtonTextSelected,
                      ]}
                    >
                      Professor
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Campos específicos para Aluno */}
              {role === 'STUDENT' && (
                <>
                  {/* Campo Curso */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Curso ou Disciplina</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setModalCursoVisible(true)}
                    >
                      <Text
                        style={[
                          styles.inputText,
                          !cursoSelecionado && styles.placeholderText,
                        ]}
                      >
                        {cursoSelecionado
                          ? cursoSelecionado.NomeDoCurso
                          : 'Selecione o curso ou disciplina'}
                      </Text>
                      <Feather
                        name="chevron-down"
                        size={20}
                        color={colors.muted}
                        style={styles.chevronIcon}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Campo Semestre */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Semestre</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Semestre"
                      placeholderTextColor={colors.muted}
                      value={semestre}
                      onChangeText={setSemestre}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              {/* Botão Atualizar */}
              <TouchableOpacity
                style={[styles.submitButton, editLoading && styles.submitButtonDisabled]}
                onPress={handleUpdate}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Atualizar Usuário</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Curso */}
      <Modal
        visible={modalCursoVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalCursoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Curso</Text>
              <TouchableOpacity
                onPress={() => setModalCursoVisible(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {loadingCursos ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={cursos}
                keyExtractor={(item) => item.IDCurso}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.cursoItem}
                    onPress={() => {
                      setCursoSelecionado(item);
                      setModalCursoVisible(false);
                    }}
                  >
                    <Text style={styles.cursoItemText}>
                      {item.NomeDoCurso}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>
                      Nenhum curso disponível
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  placeholderText: {
    color: colors.muted,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  roleButtonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    color: colors.muted,
  },
  cursoItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cursoItemText: {
    fontSize: 14,
    color: colors.text,
  },
});
