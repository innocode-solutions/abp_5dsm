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
import colors from "../theme/colors";
import { RootStackParamList } from "../navigation";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onEnter = useCallback(async () => {
    // Adicione um log para garantir que a função está sendo chamada
    console.log("Tentativa de Login iniciada.");

    // CORREÇÃO 2: Validação usa 'password'
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      // CORREÇÃO 3: Chamada da função login usa 'password'
      await login(email, password);

      // Se for bem-sucedido, o AuthContext deve atualizar o user e a navegação deve acontecer
      // Se não houver navegação automática pelo AuthContext, você precisará adicionar aqui:
      // navigation.replace('Home' ou sua tela inicial após login)
    } catch (error: any) {
      // Log detalhado para o console do Metro Bundler
      console.log(
        "Erro de Login Detalhado:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Erro",
        error?.response?.data?.error || error?.message || "Falha ao fazer login"
      );
    } finally {
      setLoading(false);
    }
    // CORREÇÃO 4: Dependências do useCallback corretas
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

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              // CORREÇÃO 5: Usar 'password' para o valor
              value={password}
              // CORREÇÃO 6: Usar 'setPassword' para a função de atualização
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={[styles.input, { marginTop: 12 }]}
            />

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

            <TouchableOpacity onPress={() => {}} style={styles.linkWrap}>
              <Text style={styles.link}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 4,
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