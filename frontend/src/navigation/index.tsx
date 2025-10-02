import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import UsersScreen from '../screens/UsersScreen';
import CoursesScreen from '../screens/CoursesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';

import TabBarIcon from '../components/TabBarIcon';
import colors from '../theme/colors';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

export type RootTabParamList = {
  Dashboard: undefined;
  Usuários: undefined;
  Cursos: undefined;
  Configurações: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs({ navigation: parentNavigation }: any) {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      // ⚠️ Use função aqui para garantir que o header pegue o navigation correto
      screenOptions={({ navigation }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopWidth: 0, elevation: 0 },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              // Faz reset para a tela de Login no Stack PAI
              parentNavigation.replace('Login');
            }}
            style={{ marginRight: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Sair"
          >
            <Feather name="log-out" size={20} color={colors.text} />
          </TouchableOpacity>
        ),
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
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }} // headers vêm do Tab Navigator
      />
    </Stack.Navigator>
  );
}
