import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import colors from "../theme/colors";
import { RootStackParamList } from "../navigation";
import { useAuth } from "../context/AuthContext";
import PasswordResetModal from "./PasswordResetModal";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordResetVisible, setPasswordResetVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { login } = useAuth();

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError("Email é obrigatório");
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError("Email inválido");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (passwordValue: string): boolean => {
    if (!passwordValue) {
      setPasswordError("Senha é obrigatória");
      return false;
    }
    if (passwordValue.length < 6) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const onEnter = useCallback(async () => {

    // Limpar erros anteriores
    setEmailError(null);
    setPasswordError(null);

    // Validar campos
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {

      const errorMessage = error?.response?.data?.error || error?.message || "Falha ao fazer login";
      
      // Verificar se o erro é relacionado a email ou senha
      const errorLower = errorMessage.toLowerCase();
      if (errorLower.includes('email') || errorLower.includes('usuário') || errorLower.includes('não encontrado')) {
        setEmailError(errorMessage);
      } else if (errorLower.includes('senha') || errorLower.includes('password') || errorLower.includes('incorreta')) {
        setPasswordError(errorMessage);
      } else {
        // Se não for específico, mostrar em ambos ou em um campo genérico
        setPasswordError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  return (
    <LinearGradient
      style={styles.flex}
      colors={["#1D2640", "#242E50", "#4A90E2"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.flex}
      >
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>Mentora</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                {(emailFocused || email) && (
                  <Text style={[styles.floatingLabel, emailFocused && styles.floatingLabelFocused]}>
                    Email
                  </Text>
                )}
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError(null);
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => {
                    setEmailFocused(false);
                    validateEmail(email);
                  }}
                  placeholder={emailFocused ? "" : "Email"}
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    emailFocused && styles.inputFocused,
                    emailError && styles.inputError,
                  ]}
                />
              </View>
              {emailError && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={14} color="#E53935" />
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                {(passwordFocused || password) && (
                  <Text style={[styles.floatingLabel, passwordFocused && styles.floatingLabelFocused]}>
                    Senha
                  </Text>
                )}
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(null);
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    setPasswordFocused(false);
                    validatePassword(password);
                  }}
                  placeholder={passwordFocused ? "" : "Senha"}
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  style={[
                    styles.input,
                    styles.passwordInput,
                    passwordFocused && styles.inputFocused,
                    passwordError && styles.inputError,
                  ]}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>
              {passwordError && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={14} color="#E53935" />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onEnter}
              style={styles.button}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPasswordResetVisible(true)}
              style={styles.linkWrap}
            >
              <Text style={styles.link}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Password Reset Modal */}
      <PasswordResetModal
        visible={passwordResetVisible}
        onClose={() => setPasswordResetVisible(false)}
        onSuccess={() => {
          // Optional: Navigate to login or show success message
          Alert.alert("Sucesso", "Sua senha foi redefinida. Faça login!");
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    elevation: 4,
    // @ts-ignore - boxShadow é necessário para React Native Web
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.15)',
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWrapper: {
    position: "relative",
  },
  floatingLabel: {
    position: "absolute",
    left: 12,
    top: -8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
    fontSize: 12,
    color: colors.muted,
    zIndex: 1,
  },
  floatingLabelFocused: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  inputFocused: {
    borderColor: "#4A90E2",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
  },
  inputError: {
    borderColor: "#E53935",
    backgroundColor: "#FFF5F5",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#E53935",
    marginLeft: 4,
  },
  button: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    backgroundColor: "#4A90E2",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#A0AEC0",
    opacity: 0.7,
  },
  linkWrap: { marginTop: 10, alignItems: "center" },
  link: { color: "#111827", fontSize: 12 },
});