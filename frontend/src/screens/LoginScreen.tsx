import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import colors from '../theme/colors';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isSenhaFocused, setIsSenhaFocused] = useState(false);

  const onEnter = useCallback(() => {
    navigation.replace('MainTabs');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        style={styles.flex}
        colors={['#F7FAFF', '#F9FAFB', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(99, 102, 241, 0.25)', 'rgba(59, 130, 246, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.decorBlobA}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(14, 165, 233, 0.18)', 'rgba(139, 92, 246, 0.06)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.decorBlobB}
        />
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.flex}
        >
          <View style={IS_MOBILE ? styles.containerMobile : styles.containerDesktop}>
            {IS_MOBILE ? (
              <>
                <View style={styles.aboutSectionMobile}>
                  <LinearGradient
                    colors={['#EAF2FF', '#EEF1FF', '#F6EDFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aboutBoxMobile}
                  >
                    <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />
                    <View style={styles.aboutContent}>
                      <View style={styles.iconWrapper}>
                        <Text style={styles.aboutIcon}>🎓</Text>
                      </View>
                      <Text style={styles.aboutTitle}>Bem-vindo ao AthenaAI</Text>
                      <Text style={styles.aboutDescription}>
                        Sua plataforma inteligente de gestão educacional com predições avançadas de IA
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.loginSectionMobile}>
                  <View style={styles.card}>
                    <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} pointerEvents="none" />
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Bem-vindo de volta</Text>
                      <Text style={styles.cardSubtitle}>Entre para continuar</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="seu@email.com"
                        placeholderTextColor={colors.muted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        style={[styles.input, isEmailFocused && styles.inputFocused]}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Senha</Text>
                      <TextInput
                        value={senha}
                        onChangeText={setSenha}
                        placeholder="••••••••"
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        autoCapitalize="none"
                        onFocus={() => setIsSenhaFocused(true)}
                        onBlur={() => setIsSenhaFocused(false)}
                        style={[styles.input, isSenhaFocused && styles.inputFocused]}
                      />
                    </View>

                    <TouchableOpacity onPress={onEnter} style={styles.button} activeOpacity={0.9}>
                      <LinearGradient
                        colors={['#6366F1', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>Entrar</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => {}} style={styles.linkWrap}>
                      <Text style={styles.link}>Esqueci minha senha</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.aboutSectionDesktop}>
                  <LinearGradient
                    colors={['#EAF2FF', '#EEF1FF', '#F6EDFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aboutBoxDesktop}
                  >
                    <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />
                    <View style={styles.aboutContent}>
                      <View style={styles.iconWrapper}>
                        <Text style={styles.aboutIcon}>🎓</Text>
                      </View>
                      <Text style={styles.aboutTitle}>Bem-vindo ao AthenaAI</Text>
                      <Text style={styles.aboutDescription}>
                        Sua plataforma inteligente de gestão educacional com predições avançadas de IA
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.loginSectionDesktop}>
                  <View style={styles.card}>
                    <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} pointerEvents="none" />
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Bem-vindo de volta</Text>
                      <Text style={styles.cardSubtitle}>Entre para continuar</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="seu@email.com"
                        placeholderTextColor={colors.muted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Senha</Text>
                      <TextInput
                        value={senha}
                        onChangeText={setSenha}
                        placeholder="••••••••"
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        autoCapitalize="none"
                        style={styles.input}
                      />
                    </View>

                    <TouchableOpacity onPress={onEnter} style={styles.button} activeOpacity={0.9}>
                      <LinearGradient
                        colors={['#6366F1', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>Entrar</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => {}} style={styles.linkWrap}>
                      <Text style={styles.link}>Esqueci minha senha</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: { flex: 1 },
  decorBlobA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -80,
    left: -40,
    opacity: 0.6,
  },
  decorBlobB: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    bottom: -120,
    right: -60,
    opacity: 0.5,
  },
  containerMobile: {
    flex: 1,
  },
  containerDesktop: {
    flex: 1,
    flexDirection: 'row',
  },
  aboutSectionMobile: {
    height: 280,
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  aboutBoxMobile: {
    borderRadius: 28,
    paddingVertical: 48,
    paddingHorizontal: 24,
    padding: 10,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  aboutSectionDesktop: {
    width: '50%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingRight: 20,
    backgroundColor: 'transparent',
  },
  aboutBoxDesktop: {
    borderRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 40,
    padding: 10,
    width: '100%',
    height: '100%',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 40,
    elevation: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  aboutContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    ...(SCREEN_WIDTH < 768 && { width: 100, height: 100, borderRadius: 50, marginBottom: 24 }),
  },
  aboutIcon: {
    fontSize: 56,
    ...(SCREEN_WIDTH < 768 && { fontSize: 48 }),
  },
  aboutTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    ...(SCREEN_WIDTH < 768 && { fontSize: 26 }),
  },
  aboutDescription: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 24,
    fontWeight: '400',
    ...(SCREEN_WIDTH < 768 && { fontSize: 15, lineHeight: 22 }),
  },
  loginSectionMobile: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  loginSectionDesktop: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 80,
    paddingLeft: 20,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 40,
    paddingVertical: 48,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 12,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    marginBottom: 36,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    ...(SCREEN_WIDTH < 768 && { fontSize: 28 }),
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  inputFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
    shadowColor: '#4A90E2',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  linkWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    color: '#4A90E2',
    fontSize: 15,
    fontWeight: '600',
  },
});
