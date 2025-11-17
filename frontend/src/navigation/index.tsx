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
import HabitsScreen from '../screens/HabitScreen';
<<<<<<< HEAD
import EngagementScreen from '../screens/EngagementScreen';
=======
import ClassStudentsScreen from '../screens/ClassStudentsScreen';
>>>>>>> 3a0173f489decaaf207ec8201839f642b9847edf

import TabBarIcon from '../components/TabBarIcon';
import colors from '../theme/colors';
import ClassPerformance from '~/screens/ClassPerformance';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  DashboardIES: undefined;
  StudentCard: undefined;
  ClassPerformance: undefined;
  Habits: undefined;
  Engagement: undefined;
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
  Dashboard: undefined;
  Usuários: undefined;
  Cursos: undefined;
  Configurações: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
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

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
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
        <Stack.Screen
          name="DashboardIES"
          component={DashboardIESScreen}
          options={{
            headerTitle: 'Dashboard IES',
            headerShown: true,
            headerRight: () => <LogoutButton onPress={async () => await logout()} />,
          }}
        />
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