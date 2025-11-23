import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { apiConnection } from '../api/apiConnection';
import { getToken } from '../service/tokenStore';

export default function ChangePasswordScreen({ navigation }: any) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Erro', 'Digite sua senha atual');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Erro', 'Digite a nova senha');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        navigation.goBack();
        return;
      }

      await apiConnection.put(
        `/auth/${user?.IDUser}/password`,
        {
          PasswordHash: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Sucesso', 'Senha alterada com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Erro ao alterar senha. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Alterar Senha</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha Atual</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Digite sua senha atual"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nova Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Digite a nova senha"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Mínimo de 6 caracteres</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Nova Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirme a nova senha"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="lock" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Alterar Senha</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 12,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary || '#4A90E2',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

