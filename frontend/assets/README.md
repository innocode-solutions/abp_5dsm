# 📁 Assets - Ícones e Imagens

Esta pasta contém os ícones e imagens do app.

## 📋 Arquivos Necessários

### Ícones
- **icon.png** - 1024x1024px
  - Ícone principal do app
  - Formato: PNG com transparência
  - Usado em todas as plataformas

- **adaptive-icon.png** - 1024x1024px
  - Ícone adaptativo para Android
  - Deve ter margem de segurança (foreground)
  - Background será preenchido automaticamente

### Splash Screen
- **splash.png** - 1284x2778px (ou proporção similar)
  - Tela de splash (tela inicial)
  - Deve ser centralizada
  - Background: #ffffff

### Web
- **favicon.png** - 48x48px
  - Favicon para versão web
  - Formato: PNG ou ICO

## 🎨 Ferramentas Recomendadas

- **Figma** - Para criar os ícones
- **Canva** - Para templates rápidos
- **ImageMagick** - Para redimensionar imagens
- **Online Tools**:
  - https://www.appicon.co/ - Gera todos os tamanhos
  - https://www.favicon-generator.org/ - Gera favicon

## 📝 Como Criar

### Ícone Principal (icon.png)
1. Crie um design 1024x1024px
2. Exporte como PNG com transparência
3. Salve como `icon.png`

### Ícone Adaptativo (adaptive-icon.png)
1. Crie um design 1024x1024px
2. Deixe margem de ~200px nas bordas (zona segura)
3. O conteúdo principal deve estar no centro 624x624px
4. Exporte como PNG
5. Salve como `adaptive-icon.png`

### Splash Screen (splash.png)
1. Crie um design 1284x2778px (ou proporção similar)
2. Background: #ffffff
3. Centralize o logo/conteúdo
4. Exporte como PNG
5. Salve como `splash.png`

## ⚠️ Nota

Se você não tiver os assets ainda, o app ainda funcionará, mas:
- O Expo usará ícones padrão
- Você verá avisos no build
- Recomenda-se criar os assets antes do build de produção

## 🔄 Atualizar Assets

Após criar os assets, você pode precisar limpar o cache:

```bash
npx expo start --clear
```

Ou para rebuild completo:

```bash
npx expo prebuild --clean
```

