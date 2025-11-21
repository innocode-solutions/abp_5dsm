import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import UsersScreen from '../screens/UsersScreenIES';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardIESScreen from '../screens/DashboardIESScreen';

import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import HabitsScreen from '../screens/StudentHabitScreen';
import EngagementScreen from '../screens/StudentEngagementScreen';
import StudentFeedbacksScreen from '../screens/StudentFeedbacksScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';

import ClassesTeacherScreen from '../screens/ClassesTeacherScreen';
import AddUserScreen from '../screens/AddUserScreen';
import TeacherClassOverviewScreen from '../screens/TeacherClassOverviewScreen';
import ClassPerformance from '../screens/ClassPerformance';
import ClassStudentsScreen from '../screens/ClassStudentsScreen';

import SimulationResultScreen from '../screens/SimulationResultScreen';
import StudentCardScreen from '../screens/StudentCardScreen';

import TabBarIcon from '../components/TabBarIcon';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import CoursesIESScreen from '~/screens/CoursesIESScreen';
import TeacherStudentsScreen from '../screens/TeacherStudentScreen';
import TeacherReportsScreen from '../screens/TeacherReportScreen';
import StudentPerformanceScreen from '../screens/StudentPerformanceScreen';

// ====================================================
// =============== PARAM LISTS ========================
// ====================================================
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  AdminTabs: undefined;

  // ADMIN
  DashboardIES: undefined;

  // STUDENT
  StudentDashboard: undefined;
  StudentTabs: undefined;
  Habits: undefined;
  Engagement: undefined;
  AddUser: undefined;

  // TEACHER
  TeacherClasses: undefined;
  TeacherClassOverview: {
    subjectId: string;
    subjectName?: string;
  };
  ClassStudents: {
    subjectId: string;
    subjectName?: string;
  };
  ClassPerformance: undefined;
  StudentPerformance: { // ✅ Nova rota
    studentId: string;
    studentName?: string;
    subjectId?: string; // opcional, para contexto da turma
  };

  // SHARED
  SimulationResult: any;
  StudentCard: undefined;
};

export type RootTabParamList = {
  Turmas: undefined; // teacher only
  Alunos: undefined; // teacher only
  Relatórios: undefined; // teacher only
  Configurações: undefined; // teacher only
  Dashboard: undefined; // admin only
  Usuários: undefined;
  Cursos: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Usuários: undefined;
  Cursos: undefined;
  Configurações: undefined;
};

export type StudentTabParamList = {
  Home: undefined;
  Formulário: undefined;
  Feedbacks: undefined;
};

// ====================================================
// =============== NAVIGATORS =========================
// ====================================================
const Tab = createBottomTabNavigator<RootTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const StudentTab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// ====================================================
// =============== COMPONENTES ========================
// ====================================================
function LogoutButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ marginRight: 16 }}
      accessibilityRole="button"
      accessibilityLabel="Sair"
    >
      <Feather name="log-out" size={20} color={colors.text} />
    </TouchableOpacity>
  );
}

// ====================================================
// ========== TABS DO PROFESSOR (TEACHER) =============
// ====================================================
function TeacherTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Turmas"
      screenOptions={() => ({
        headerTitleAlign: 'center',
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          display: 'flex',
          borderTopWidth: 1,
          elevation: 3,
          backgroundColor: '#fff',
          height: 60 + insets.bottom, // ✅ Adicionar espaço para área segura
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8, // ✅ Padding inferior
          paddingTop: 8, // ✅ Padding superior para melhor espaçamento
        },
      })}
    >
      <Tab.Screen
        name="Turmas"
        component={ClassesTeacherScreen}
        options={{
          headerTitle: 'Turmas',
          tabBarLabel: 'Turmas',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="users" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Alunos"
        component={TeacherStudentsScreen}
        options={{
          headerTitle: 'Alunos',
          tabBarLabel: 'Alunos',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Relatórios"
        component={TeacherReportsScreen}
        options={{
          headerTitle: 'Relatórios',
          tabBarLabel: 'Relatórios',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Configurações"
        component={SettingsScreen}
        options={{
          headerTitle: 'Configurações',
          tabBarLabel: 'Configurações',
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs({ navigation: parentNavigation }: any) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    parentNavigation.replace('Login');
  };

  return (
    <AdminTab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ navigation }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopWidth: 0, elevation: 0 },
        headerRight: () => <LogoutButton onPress={handleLogout} />,
      })}
    >
      <AdminTab.Screen
        name="Dashboard"
        component={DashboardIESScreen}
        options={{
          headerTitle: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Usuários"
        component={UsersScreen}
        options={({ navigation }) => ({
          headerTitle: 'Usuários',
          tabBarLabel: 'Usuários',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="users" color={color} size={size} />
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => parentNavigation.navigate('AddUser')}
                style={{ marginRight: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Adicionar usuário"
              >
                <Feather name="plus" size={24} color={colors.text} />
              </TouchableOpacity>
              <LogoutButton onPress={handleLogout} />
            </View>
          ),
        })}
      />
      <AdminTab.Screen
        name="Cursos"
        component={CoursesIESScreen}
        options={{
          headerTitle: 'Cursos',
          tabBarLabel: 'Cursos',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="book-open" color={color} size={size} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Configurações"
        component={SettingsScreen}
        options={{
          headerTitle: 'Configurações',
          tabBarLabel: 'Configurações',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </AdminTab.Navigator>
  );
}

// ====================================================
// ========== TABS DO ALUNO (STUDENT) =================
// ====================================================
function StudentTabs() {
  return (
    <StudentTab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopWidth: 0, elevation: 0 },
      }}
    >
      <StudentTab.Screen
        name="Home"
        component={StudentDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <StudentTab.Screen
        name="Formulário"
        component={HabitsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Formulario',
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <StudentTab.Screen
        name="Feedbacks"
        component={StudentFeedbacksScreen}
        options={{
          headerShown: true,
          headerTitle: 'Feedbacks',
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
    </StudentTab.Navigator>
  );
}

// ====================================================
// ================ ROOT NAVIGATOR ====================
// ====================================================
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { Platform } from 'react-native';

export default function RootNavigator() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigation = useNavigation();
  const prevAuthRef = useRef(isAuthenticated);

  // ✅ Detectar mudanças de autenticação
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated && !isLoading) {
      if (Platform.OS === 'web') {
        // Forçar navegação para Login na web
        requestAnimationFrame(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        });
      }
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading, navigation]);

  // ✅ Na web, escutar evento de logout
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleLogout = () => {
      // Pequeno delay para garantir que o estado foi atualizado
      requestAnimationFrame(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      });
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, [navigation]);

  // ✅ Usar key para forçar re-renderização na web
  return (
    <Stack.Navigator
      key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
      screenOptions={{ headerShown: false }}
    >
      {/* PUBLIC */}
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user?.Role === 'ADMIN' ? (
        <>
          <Stack.Screen
            name="AdminTabs"
            component={AdminTabs}
          />
          <Stack.Screen
            name="AddUser"
            component={AddUserScreen}
            options={{
              headerTitle: 'Adicionar Usuário',
              headerShown: true,
              headerBackTitle: '',
            }}
          />
          {/* ADMIN */}
          <Stack.Screen
            name="DashboardIES"
            component={DashboardIESScreen}
            options={{
              headerShown: true,
              headerTitle: 'Dashboard IES',
              headerRight: () => <LogoutButton onPress={logout} />,
            }}
          />
        </>
      ) : user?.Role === 'STUDENT' ? (
        /* STUDENT */
        <>
          <Stack.Screen name="StudentDashboard" component={StudentTabs} />
          <Stack.Screen name="Habits" component={HabitsScreen} />
          <Stack.Screen name="Engagement" component={EngagementScreen} />
        </>
      ) : (
        /* TEACHER */
        <>
          <Stack.Screen name="TeacherClasses" component={TeacherTabs} />
          <Stack.Screen name="TeacherClassOverview" component={TeacherClassOverviewScreen} />
          <Stack.Screen
            name="ClassStudents"
            component={ClassStudentsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Alunos da Turma',
              headerBackTitle: 'Voltar',
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen name="ClassPerformance" component={ClassPerformance} />
          <Stack.Screen name="SimulationResult" component={SimulationResultScreen} />
          <Stack.Screen
            name="StudentPerformance"
            component={StudentPerformanceScreen}
            options={{
              headerShown: true,
              headerTitle: 'Desempenho do Aluno',
              headerBackTitle: 'Voltar',
              headerTintColor: colors.primary,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
