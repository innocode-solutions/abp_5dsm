import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import colors from '../theme/colors';
import PasswordResetService from '../service/passwordResetService';

interface ForgotPasswordScreenProps {
  onCodeSent: (email: string) => void;
}

export default function ForgotPasswordScreen({
  onCodeSent,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleSendCode = async () => {
    setMessage('');
    setMessageType('');

    // Validate email
    if (!email.trim()) {
      setMessage('Por favor, insira seu e-mail');
      setMessageType('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('E-mail inválido');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const response = await PasswordResetService.requestResetCode(email);
      setMessage(response.message);
      setMessageType('success');

      // Call the callback to move to next screen after 1.5 seconds
      setTimeout(() => {
        onCodeSent(email);
      }, 1500);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Erro ao enviar código';
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
            <Text style={styles.title}>Esqueci a Senha</Text>
            <Text style={styles.subtitle}>
              Digite seu e-mail para receber um código de redefinição
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              value={email}
              onChangeText={setEmail}
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

            {/* Send Code Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar Código</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              Você receberá um código de 6 dígitos no seu e-mail. Guarde-o em
              segurança.
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
    backgroundColor: '#fff',
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
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
