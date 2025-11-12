import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation';
import { HabitProvider } from '~/context/HabitContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HabitProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
        </HabitProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
