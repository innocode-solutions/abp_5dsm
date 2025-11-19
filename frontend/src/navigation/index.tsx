import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import UsersScreen from '../screens/UsersScreen';
import CoursesScreen from '../screens/CoursesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardIESScreen from '../screens/DashboardIESScreen';
import SimulationResultScreen from '../screens/SimulationResultScreen';
import StudentCardScreen from '../screens/StudentCardScreen';
import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import HabitsScreen from '../screens/StudentHabitScreen';
import EngagementScreen from '../screens/StudentEngagementScreen';
import ClassStudentsScreen from '../screens/ClassStudentsScreen';
import StudentFeedbacksScreen from '../screens/StudentFeedbacksScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import ClassesTeacherScreen from '../screens/ClassesTeacherScreen';
import AddUserScreen from '../screens/AddUserScreen';

import TabBarIcon from '../components/TabBarIcon';
import colors from '../theme/colors';
import ClassPerformance from '~/screens/ClassPerformance';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  AdminTabs: undefined;
  DashboardIES: undefined;
  StudentDashboard: undefined;
  StudentTabs: undefined;
  StudentCard: undefined;
  ClassPerformance: undefined;
  Habits: undefined;
  Engagement: undefined;
  AddUser: undefined;
  ClassStudents: {
    subjectId: string;
    subjectName?: string;
  };
  SimulationResult: {
    predicted_score: number;
    approval_status: string;
    grade_category: string;
    disciplina: {
      IDDisciplina: string;
      NomeDaDisciplina: string;
      CodigoDaDisciplina?: string;
    };
    periodo: {
      IDPeriodo: string;
      Nome: string;
    };
    Explicacao?: string;
    IDPrediction?: string;
    IDMatricula?: string;
  };
};

export type RootTabParamList = {
  Turmas: undefined;
  Dashboard: undefined;
  Usuários: undefined;
  Cursos: undefined;
  Configurações: undefined;
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

const Tab = createBottomTabNavigator<RootTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const StudentTab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Logout button component
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

function MainTabs({ navigation: parentNavigation }: any) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    parentNavigation.replace('Login');
  };

  const handleAddClass = () => {
    // TODO: Implementar navegação para tela de adicionar turma
    console.log('Adicionar nova turma');
  };

  return (
    <Tab.Navigator
      initialRouteName="Turmas"
      // ⚠️ Use função aqui para garantir que o header pegue o navigation correto
      screenOptions={({ navigation }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopWidth: 0, elevation: 0 },
        headerRight: () => <LogoutButton onPress={handleLogout} />,
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
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleAddClass}
                style={{ marginRight: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Adicionar turma"
              >
                <Feather name="plus" size={24} color={colors.text} />
              </TouchableOpacity>
              <LogoutButton onPress={handleLogout} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Usuários"
        component={UsersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="users" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Cursos"
        component={CoursesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="book-open" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Configurações"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="settings" color={color} size={size} />
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
                onPress={() => navigation.navigate('AddUser')}
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
        component={CoursesScreen}
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

function StudentTabs({ navigation: parentNavigation }: any) {
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
          tabBarLabel: 'Home',
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
          tabBarLabel: 'Formulário',
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
          tabBarLabel: 'Feedbacks',
        }}
      />
    </StudentTab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
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
              headerBackTitleVisible: false,
            }}
          />
        </>
      ) : user?.Role === 'STUDENT' ? (
        <>
          <Stack.Screen
            name="StudentDashboard"
            component={StudentTabs}
          />
          <Stack.Screen
            name="Habits"
            component={HabitsScreen}
            options={{ headerShown: true, headerTitle: 'Formulario' }}
          />
          <Stack.Screen
            name="Engagement"
            component={EngagementScreen}
            options={{ headerShown: true, headerTitle: 'Predição de Evasão' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
          />
          <Stack.Screen
            name="StudentCard"
            component={StudentCardScreen}
            options={{ headerShown: true, headerTitle: 'Estudantes' }}
          />
          <Stack.Screen
            name="Habits"
            component={HabitsScreen}
            options={{ headerShown: true, headerTitle: 'Hábitos de Estudo' }}
          />
          <Stack.Screen
            name="ClassPerformance"
            component={ClassPerformance}
            options={{ headerShown: true, headerTitle: 'Performance da Turma' }}
          />
          <Stack.Screen
            name="Engagement"
            component={EngagementScreen}
            options={{ headerShown: true, headerTitle: 'Predição de Evasão' }}
            />
            <Stack.Screen
            name="ClassStudents"
            component={ClassStudentsScreen}
            options={{ headerShown: true, headerTitle: 'Alunos da Turma' }}
          />
          <Stack.Screen
            name="SimulationResult"
            component={SimulationResultScreen}
            options={{ headerShown: true, headerTitle: 'Resultado da Simulação' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}