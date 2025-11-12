import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import UsersScreen from '../screens/UsersScreen';
import CoursesScreen from '../screens/CoursesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import StudentCardScreen from '../screens/StudentCardScreen';
import HabitsScreen from '../screens/HabitScreen';

import TabBarIcon from '../components/TabBarIcon';
import colors from '../theme/colors';
import ClassPerformance from '~/screens/ClassPerformance';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  StudentCard: undefined;
  ClassPerformance: undefined;
  Habits:undefined;
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
  const { isAuthenticated, isLoading } = useAuth();

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
      ) : (
        <>
          <Stack.Screen
            name="StudentCard"
            component={StudentCardScreen}
            options={{ headerShown: true, headerTitle: 'Estudantes' }}
          />
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
          />
          <Stack.Screen
            name="Habits"
            component={HabitsScreen}
            options={{ headerTitle: 'Hábitos de Estudo' }}
          />
          <Stack.Screen
            name="ClassPerformance"
            component={ClassPerformance}
            options={{ headerShown: true, headerTitle: 'Performance da Turma' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
