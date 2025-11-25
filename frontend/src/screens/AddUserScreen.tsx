import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { RootStackParamList } from '../navigation';
import { userService, Curso, Disciplina } from '../service/userService';

type Props = NativeStackScreenProps<RootStackParamList, 'AddUser'>;

type UserRole = 'STUDENT' | 'TEACHER';

export default function AddUserScreen({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [cursoSelecionado, setCursoSelecionado] = useState<Curso | null>(null);
  const [semestre, setSemestre] = useState('');
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<Disciplina | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [modalCursoVisible, setModalCursoVisible] = useState(false);
  const [modalDisciplinaVisible, setModalDisciplinaVisible] = useState(false);

  useEffect(() => {
    if (role === 'STUDENT') {
      loadCursos();
      setDisciplinaSelecionada(null);
    } else if (role === 'TEACHER') {
      loadDisciplinas();
      setCursoSelecionado(null);
      setSemestre('');
    } else {
      setCursoSelecionado(null);
      setDisciplinaSelecionada(null);
      setSemestre('');
    }
  }, [role]);

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

  const loadDisciplinas = async () => {
    setLoadingDisciplinas(true);
    try {
      const disciplinasData = await userService.getDisciplinas();
      setDisciplinas(disciplinasData);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar as disciplinas');
      console.error('Erro ao carregar disciplinas:', error);
    } finally {
      setLoadingDisciplinas(false);
    }
  };

  const validateForm = (): boolean => {
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

    if (!senha.trim()) {
      Alert.alert('Erro', 'Senha é obrigatória');
      return false;
    }

    if (senha.length < 8) {
      Alert.alert('Erro', 'Senha deve ter no mínimo 8 caracteres');
      return false;
    }

    if (!role) {
      Alert.alert('Erro', 'Selecione o tipo de usuário (Aluno ou Professor)');
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

    if (role === 'TEACHER') {
      if (!disciplinaSelecionada) {
        Alert.alert('Erro', 'Selecione a disciplina');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userData: any = {
        Email: email.trim(),
        password: senha,
        Role: role,
        name: nome.trim(),
      };

      if (role === 'STUDENT') {
        userData.alunoData = {
          Nome: nome.trim(),
          Semestre: parseInt(semestre, 10),
          IDCurso: cursoSelecionado!.IDCurso,
        };
      }

      if (role === 'TEACHER') {
        userData.disciplinaData = {
          IDDisciplina: disciplinaSelecionada!.IDDisciplina,
        };
      }

      await userService.createUser(userData);

      Alert.alert('Sucesso', 'Usuário criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Erro ao criar usuário';
      Alert.alert('Erro', errorMessage);
      console.error('Erro ao criar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

        {/* Campo Senha */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Senha do usuário"
            placeholderTextColor={colors.muted}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
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
              onPress={() => setRole('STUDENT')}
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
              <Text style={styles.label}>Curso</Text>
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
                    : 'Selecione o curso'}
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

        {/* Campos específicos para Professor */}
        {role === 'TEACHER' && (
          <>
            {/* Campo Disciplina */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Disciplina *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setModalDisciplinaVisible(true)}
              >
                <Text
                  style={[
                    styles.inputText,
                    !disciplinaSelecionada && styles.placeholderText,
                  ]}
                >
                  {disciplinaSelecionada
                    ? `${disciplinaSelecionada.NomeDaDisciplina}${disciplinaSelecionada.curso ? ` - ${disciplinaSelecionada.curso.NomeDoCurso}` : ''}`
                    : 'Selecione a disciplina'}
                </Text>
                <Feather
                  name="chevron-down"
                  size={20}
                  color={colors.muted}
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Botão Adicionar Usuário */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Adicionar Usuário</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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

      {/* Modal de Seleção de Disciplina */}
      <Modal
        visible={modalDisciplinaVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalDisciplinaVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Disciplina</Text>
              <TouchableOpacity
                onPress={() => setModalDisciplinaVisible(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {loadingDisciplinas ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={disciplinas}
                keyExtractor={(item) => item.IDDisciplina}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.cursoItem}
                    onPress={() => {
                      setDisciplinaSelecionada(item);
                      setModalDisciplinaVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.cursoItemText}>
                        {item.NomeDaDisciplina}
                      </Text>
                      {item.curso && (
                        <Text style={[styles.cursoItemText, { fontSize: 12, color: colors.muted, marginTop: 4 }]}>
                          {item.curso.NomeDoCurso}
                        </Text>
                      )}
                      {item.CodigoDaDisciplina && (
                        <Text style={[styles.cursoItemText, { fontSize: 12, color: colors.muted }]}>
                          Código: {item.CodigoDaDisciplina}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>
                      Nenhuma disciplina disponível
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
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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

