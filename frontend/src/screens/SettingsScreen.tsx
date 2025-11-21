import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import colors from '../theme/colors';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    // ✅ Na web, usar window.confirm ou modal customizado
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
      
      // ✅ Na web, forçar navegação imediatamente
      if (Platform.OS === 'web') {
        // Usar requestAnimationFrame para garantir que o estado foi atualizado
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
      console.error('Erro ao fazer logout:', err);
      if (Platform.OS !== 'web') {
        Alert.alert('Erro', 'Não foi possível fazer logout');
      } else {
        alert('Erro: Não foi possível fazer logout');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Configurações</Text>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Feather name="user" size={48} color={colors.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'Professor'}</Text>
          <Text style={styles.email}>{user?.Email || ''}</Text>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Feather name="user" size={20} color={colors.text} />
            <Text style={styles.settingText}>Editar Perfil</Text>
            <Feather name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Feather name="lock" size={20} color={colors.text} />
            <Text style={styles.settingText}>Alterar Senha</Text>
            <Feather name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Feather name="bell" size={20} color={colors.text} />
            <Text style={styles.settingText}>Notificações</Text>
            <Feather name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
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
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
