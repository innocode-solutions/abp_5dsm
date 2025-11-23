import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import colors from '../theme/colors';
import { getStudentDetails, getStudentIdByUserId, StudentDetails } from '../service/studentService';

type StudentProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function StudentProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<StudentProfileNavigationProp>();
  const [studentData, setStudentData] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    try {
      if (!user?.IDUser) return;
      
      const studentId = await getStudentIdByUserId();
      if (!studentId) {
        setLoading(false);
        return;
      }
      
      const data = await getStudentDetails(studentId);
      setStudentData(data);
    } catch (error) {
      // Silenciar erro
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
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
  };

  const performLogout = async () => {
    try {
      await logout();
      
      if (Platform.OS === 'web') {
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
      if (Platform.OS !== 'web') {
        Alert.alert('Erro', 'Não foi possível fazer logout');
      } else {
        alert('Erro: Não foi possível fazer logout');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Perfil</Text>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {studentData?.Nome?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{studentData?.Nome || 'Estudante'}</Text>
          <Text style={styles.email}>{user?.Email || ''}</Text>
          
          {/* Informações Adicionais */}
          {studentData?.Matricula && (
            <View style={styles.infoRow}>
              <Feather name="hash" size={16} color={colors.muted} />
              <Text style={styles.infoText}>Matrícula: {studentData.Matricula}</Text>
            </View>
          )}
          
          {studentData?.curso && (
            <View style={styles.infoRow}>
              <Feather name="book" size={16} color={colors.muted} />
              <Text style={styles.infoText}>{studentData.curso.NomeDoCurso}</Text>
            </View>
          )}
        </View>

        {/* Informações Acadêmicas */}
        {studentData && studentData.matriculas && studentData.matriculas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disciplinas</Text>
            {studentData.matriculas.slice(0, 5).map((matricula) => (
              <TouchableOpacity
                key={matricula.IDMatricula}
                style={styles.disciplineItem}
                onPress={() => {
                  if (studentData?.IDAluno) {
                    navigation.navigate('StudentPerformance', {
                      studentId: studentData.IDAluno,
                      studentName: studentData.Nome,
                      subjectId: matricula.disciplina.IDDisciplina,
                    });
                  }
                }}
                activeOpacity={0.7}
              >
                <Feather name="book-open" size={18} color={colors.primary} />
                <View style={styles.disciplineInfo}>
                  <Text style={styles.disciplineName}>{matricula.disciplina.NomeDaDisciplina}</Text>
                  {matricula.periodo && (
                    <Text style={styles.disciplinePeriod}>{matricula.periodo.Nome}</Text>
                  )}
                </View>
                <View style={styles.disciplineRight}>
                  {matricula.Nota !== null && matricula.Nota !== undefined && (
                    <Text style={styles.disciplineGrade}>
                      {matricula.Nota.toFixed(1)}
                    </Text>
                  )}
                  <Feather name="chevron-right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>
            ))}
            {studentData.matriculas.length > 5 && (
              <Text style={styles.moreText}>
                +{studentData.matriculas.length - 5} disciplina(s)
              </Text>
            )}
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Feather name="user" size={20} color={colors.text} />
            <Text style={styles.settingText}>Editar Perfil</Text>
            <Feather name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Feather name="lock" size={20} color={colors.text} />
            <Text style={styles.settingText}>Alterar Senha</Text>
            <Feather name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Feather name="bell" size={20} color={colors.text} />
            <Text style={styles.settingText}>Notificações</Text>
            <Feather name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('About')}
          >
            <Feather name="info" size={20} color={colors.text} />
            <Text style={styles.settingText}>Sobre</Text>
            <Feather name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#fff" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.muted,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    // @ts-ignore - boxShadow é necessário para React Native Web
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary || '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.muted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  disciplineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    // @ts-ignore - boxShadow é necessário para React Native Web
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  disciplineInfo: {
    flex: 1,
    marginLeft: 12,
  },
  disciplineName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  disciplinePeriod: {
    fontSize: 12,
    color: colors.muted,
  },
  disciplineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disciplineGrade: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  moreText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    // @ts-ignore - boxShadow é necessário para React Native Web
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    // @ts-ignore - boxShadow é necessário para React Native Web
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
