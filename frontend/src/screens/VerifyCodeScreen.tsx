import React, { useState, useEffect } from 'react';
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

interface VerifyCodeScreenProps {
  email: string;
  onCodeVerified: (email: string, code: string) => void;
  onBackPress: () => void;
}

export default function VerifyCodeScreen({
  email,
  onCodeVerified,
  onBackPress,
}: VerifyCodeScreenProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer for resend button
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldownSeconds > 0) {
      timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  // Format code input to 6 digits (000000 pattern)
  const handleCodeChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    const limited = numericOnly.slice(0, 6);
    setCode(limited);
  };

  // Verify the code
  const handleVerifyCode = async () => {
    setMessage('');
    setMessageType('');

    if (code.length !== 6) {
      setMessage('Por favor, insira os 6 dígitos do código');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const response = await PasswordResetService.verifyResetCode(email, code);
      setMessage(response.message);
      setMessageType('success');

      // Navigate to reset password screen after 1.5 seconds
      setTimeout(() => {
        onCodeVerified(email, code);
      }, 1500);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Erro ao verificar código';
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Resend code with cooldown
  const handleResendCode = async () => {
    if (cooldownSeconds > 0) return;

    setMessage('');
    setMessageType('');

    try {
      await PasswordResetService.requestResetCode(email);
      setMessage('Código reenviado com sucesso');
      setMessageType('success');
      setCode('');
      setCooldownSeconds(60); // 60 second cooldown
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Erro ao reenviar código';
      setMessage(errorMsg);
      setMessageType('error');
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
            <Text style={styles.title}>Validar Código</Text>
            <Text style={styles.subtitle}>
              Insira os 6 dígitos enviados para {email}
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.form}>
            <Text style={styles.label}>Código de Verificação</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              editable={!loading}
              value={code}
              onChangeText={handleCodeChange}
              maxLength={6}
              textAlign="center"
            />

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

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verificar Código</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Resend Code Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendLabel}>Não recebeu o código?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={cooldownSeconds > 0}
              style={styles.resendButton}
            >
              <Text
                style={[
                  styles.resendButtonText,
                  cooldownSeconds > 0 && styles.resendButtonDisabled,
                ]}
              >
                {cooldownSeconds > 0
                  ? `Reenviar em ${cooldownSeconds}s`
                  : 'Reenviar Código'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              O código é válido por 10 minutos. Se não funcionou, tente reenviar.
            </Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    backgroundColor: '#fff',
    letterSpacing: 8,
  },
  messageBanner: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: colors.muted,
  },
  helpSection: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  helpText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});
