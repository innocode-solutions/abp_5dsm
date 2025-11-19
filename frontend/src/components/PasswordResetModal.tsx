import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import colors from '../theme/colors';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

export type PasswordResetStep = 'forgot' | 'verify' | 'reset' | 'completed';

interface PasswordResetModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PasswordResetModal({
  visible,
  onClose,
  onSuccess,
}: PasswordResetModalProps) {
  const [step, setStep] = useState<PasswordResetStep>('forgot');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  // Handle: Email submission (Step 1 -> Step 2)
  const handleCodeSent = (sentEmail: string) => {
    setEmail(sentEmail);
    setStep('verify');
  };

  // Handle: Code verified (Step 2 -> Step 3)
  const handleCodeVerified = (verifiedEmail: string, verifiedCode: string) => {
    setEmail(verifiedEmail);
    setCode(verifiedCode);
    setStep('reset');
  };

  // Handle: Password reset successful (Step 3 -> Completed)
  const handlePasswordReset = () => {
    setStep('completed');
    setTimeout(() => {
      if (onSuccess) onSuccess();
      handleClose();
    }, 2000);
  };

  // Back button handling
  const handleBackPress = () => {
    if (step === 'verify') {
      setStep('forgot');
      setCode('');
    } else if (step === 'reset') {
      setStep('verify');
    }
  };

  // Close modal and reset state
  const handleClose = () => {
    setStep('forgot');
    setEmail('');
    setCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Close Button */}
        {step !== 'completed' && (
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Forgot Password */}
        {step === 'forgot' && (
          <ForgotPasswordScreen onCodeSent={handleCodeSent} />
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <VerifyCodeScreen
            email={email}
            onCodeVerified={handleCodeVerified}
            onBackPress={handleBackPress}
          />
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <ResetPasswordScreen
            email={email}
            code={code}
            onPasswordReset={handlePasswordReset}
            onBackPress={handleBackPress}
          />
        )}

        {/* Completion Screen */}
        {step === 'completed' && (
          <View style={styles.completionContainer}>
            <View style={styles.completionContent}>
              <Text style={styles.completionIcon}>✓</Text>
              <Text style={styles.completionTitle}>
                Senha Redefinida com Sucesso!
              </Text>
              <Text style={styles.completionMessage}>
                Sua senha foi alterada. Você será redirecionado para o login.
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  completionContent: {
    alignItems: 'center',
  },
  completionIcon: {
    fontSize: 80,
    marginBottom: 20,
    color: colors.success,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});
