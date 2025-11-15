import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import colors from '../theme/colors';
import PasswordResetService from '../service/passwordResetService';

interface ResetPasswordScreenProps {
  email: string;
  code: string;
  onPasswordReset: () => void;
  onBackPress: () => void;
}

export default function ResetPasswordScreen({
  email,
  code,
  onPasswordReset,
  onBackPress,
}: ResetPasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // Validate password strength
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Check password match
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  // Handle password reset
  const handleResetPassword = async () => {
    setMessage('');
    setMessageType('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setMessage('Por favor, preencha os dois campos de senha');
      setMessageType('error');
      return;
    }

    if (!validatePassword(newPassword)) {
      setMessage('A senha deve ter no mínimo 6 caracteres');
      setMessageType('error');
      return;
    }

    if (!passwordsMatch) {
      setMessage('As senhas não coincidem');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const response = await PasswordResetService.resetPassword(
        email,
        code,
        newPassword,
        confirmPassword
      );
      setMessage(response.message);
      setMessageType('success');

      // Navigate to login after 2 seconds
      setTimeout(() => {
        onPasswordReset();
      }, 2000);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Erro ao redefinir senha';
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Nova Senha</Text>
            <Text style={styles.subtitle}>
              Crie uma nova senha segura para sua conta
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nova Senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Insira uma nova senha"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showNewPassword}
                  editable={!loading}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showNewPassword ? '👁' : '👁‍🗨'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {newPassword && (
                <View style={styles.strengthIndicator}>
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor: validatePassword(newPassword)
                          ? colors.success
                          : colors.error,
                      },
                    ]}
                  />
                </View>
              )}

              {newPassword && !validatePassword(newPassword) && (
                <Text style={styles.warningText}>
                  Mínimo de 6 caracteres
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirme a senha"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '👁' : '👁‍🗨'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Match Indicator */}
              {confirmPassword && (
                <View
                  style={[
                    styles.matchIndicator,
                    {
                      backgroundColor: passwordsMatch
                        ? '#d4edda'
                        : '#f8d7da',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.matchText,
                      {
                        color: passwordsMatch ? '#155724' : '#721c24',
                      },
                    ]}
                  >
                    {passwordsMatch
                      ? 'Senhas coincidem'
                      : 'Senhas não coincidem'}
                  </Text>
                </View>
              )}
            </View>

            {/* Feedback Message */}
            {message && (
              <View
                style={[
                  styles.messageBanner,
                  messageType === 'success'
                    ? styles.successBanner
                    : styles.errorBanner,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    messageType === 'success'
                      ? styles.successText
                      : styles.errorText,
                  ]}
                >
                  {message}
                </Text>
              </View>
            )}

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (loading || !passwordsMatch || !validatePassword(newPassword)) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={
                loading ||
                !passwordsMatch ||
                !validatePassword(newPassword)
              }
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Redefinir Senha</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Dicas de Segurança:</Text>
            <Text style={styles.tip}>• Use pelo menos 6 caracteres</Text>
            <Text style={styles.tip}>
              • Combine letras, números e símbolos
            </Text>
            <Text style={styles.tip}>• Não reutilize senhas antigas</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  form: {
    marginBottom: 30,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  strengthIndicator: {
    marginTop: 8,
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  warningText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  matchIndicator: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageBanner: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 16,
  },
  successBanner: {
    backgroundColor: '#d4edda',
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721c24',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
    lineHeight: 16,
  },
});
