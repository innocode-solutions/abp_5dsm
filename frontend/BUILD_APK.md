# 📱 Guia de Build APK - Android

Este guia explica como gerar um APK para Android usando Expo.

## 📋 Pré-requisitos

1. **Conta Expo** (gratuita): https://expo.dev
2. **EAS CLI** instalado globalmente:
   ```bash
   npm install -g eas-cli
   ```
3. **Login no Expo**:
   ```bash
   eas login
   ```

## 🚀 Métodos de Build

### Método 1: EAS Build (Recomendado - Na Nuvem)

O EAS Build é o método mais fácil e recomendado. O build é feito na nuvem do Expo.

#### Passo 1: Configurar o Projeto
```bash
cd frontend
eas build:configure
```

#### Passo 2: Build APK para Teste (Preview)
```bash
npm run build:android
# Ou diretamente:
eas build --platform android --profile preview
```

#### Passo 3: Build APK para Produção
```bash
eas build --platform android --profile production
```

#### Passo 4: Download do APK
- Após o build, você receberá um link para download
- Ou acesse: https://expo.dev/accounts/[seu-usuario]/projects/[seu-projeto]/builds

### Método 2: Build para Rede Local (Backend Local)

Para gerar um APK que conecta ao backend na mesma rede (`http://192.168.18.7:8080`):

#### Opção A: Script Automático (Recomendado)
```powershell
cd frontend
.\scripts\build-local.ps1
```

#### Opção B: Manual
```bash
# 1. Configurar IP no EAS
eas secret:create --scope project --name EXPO_PUBLIC_MACHINE_IP --value 192.168.18.7 --force

# 2. Build
npm run build:android:local-network
```

O perfil `local` no `eas.json` já está configurado com:
- `EXPO_PUBLIC_MACHINE_IP=192.168.18.7`
- `EXPO_PUBLIC_BACKEND_PORT=8080`

### Método 3: Build Local com Gradle (Mais Rápido, Requer Android Studio)

Se você tem Android Studio instalado e configurado, pode fazer o build localmente.

#### Passo 1: Instalar Dependências
```bash
cd frontend
npm install
```

#### Passo 2: Gerar Projeto Android Nativo
```bash
npx expo prebuild --platform android
```

#### Passo 3: Build APK
```bash
cd android
./gradlew assembleRelease
```

O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

#### Passo 4: Assinar o APK (Opcional, para distribuição)

1. Gerar keystore:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configurar no `android/app/build.gradle`:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               storeFile file('my-upload-key.keystore')
               storePassword 'sua-senha'
               keyAlias 'my-key-alias'
               keyPassword 'sua-senha'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

## 🔧 Configuração de Variáveis de Ambiente

### Para Build de Produção

Antes de fazer o build, configure as variáveis de ambiente no EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://seu-backend.railway.app/api
```

Ou crie um arquivo `.env.production`:
```env
EXPO_PUBLIC_API_URL=https://seu-backend.railway.app/api
EXPO_PUBLIC_SOCKET_URL=https://seu-backend.railway.app
```

E configure no `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://seu-backend.railway.app/api"
      }
    }
  }
}
```

## 📝 Configurações do App

### Atualizar Informações do App

Edite o arquivo `app.json`:

- **name**: Nome do app (aparece na tela inicial)
- **slug**: Identificador único do projeto
- **version**: Versão do app (ex: "1.0.0")
- **android.package**: Package name único (ex: "com.dashboardacademico.app")
- **android.versionCode**: Número de versão (incrementar a cada build)

### Ícones e Splash Screen

Crie os seguintes arquivos na pasta `frontend/assets/`:

- `icon.png` - 1024x1024px (ícone do app)
- `adaptive-icon.png` - 1024x1024px (ícone adaptativo Android)
- `splash.png` - 1284x2778px (tela de splash)
- `favicon.png` - 48x48px (favicon web)

## 🐛 Troubleshooting

### Erro: "EAS CLI not found"
```bash
npm install -g eas-cli
```

### Erro: "Not logged in"
```bash
eas login
```

### Erro: "Project not configured"
```bash
eas build:configure
```

### Erro: "Gradle build failed" (Build Local)
- Verifique se o Android Studio está instalado
- Verifique se o `ANDROID_HOME` está configurado
- Execute: `npx expo prebuild --clean`

### APK muito grande
- Use `eas build` com otimizações automáticas
- Configure ProGuard no `android/app/build.gradle`

## 📦 Distribuição

### Teste Interno
- Use o perfil `preview` do EAS Build
- Compartilhe o link de download

### Google Play Store
1. Gere um AAB (Android App Bundle) ao invés de APK:
   ```bash
   eas build --platform android --profile production
   ```
2. Configure no `eas.json`:
   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "app-bundle"
         }
       }
     }
   }
   ```

### Instalação Direta (APK)
1. Baixe o APK
2. No Android, permita "Fontes desconhecidas"
3. Instale o APK

## 🔐 Segurança

- **Nunca** commite arquivos `.keystore` ou senhas
- Use variáveis de ambiente para URLs sensíveis
- Configure secrets no EAS para produção

## 📚 Recursos

- [Documentação EAS Build](https://docs.expo.dev/build/introduction/)
- [Configuração Android](https://docs.expo.dev/workflow/android/)
- [Assinatura de Apps](https://docs.expo.dev/app-signing/app-credentials/)

