# 🔧 Como Resolver Conflitos Git Sem Perder Nada

## 🚀 Solução Rápida (Recomendada)

### Para Pull:
```powershell
powershell -ExecutionPolicy Bypass -File git_no_conflicts_simple.ps1
```

### Para Merge:
```powershell
powershell -ExecutionPolicy Bypass -File git_safe_merge.ps1 -BranchName main
```

## 📋 Scripts Disponíveis

### 1. `git_no_conflicts_simple.ps1` ⭐ (Recomendado)
- **Uso:** `powershell -ExecutionPolicy Bypass -File git_no_conflicts_simple.ps1`
- **Função:** Pull seguro que preserva todas as alterações
- **Quando usar:** Sempre que der conflito no pull

### 2. `git_safe_merge.ps1`
- **Uso:** `powershell -ExecutionPolicy Bypass -File git_safe_merge.ps1 -BranchName main`
- **Função:** Merge seguro com outra branch
- **Quando usar:** Para fazer merge com outras branches

### 3. `resolve_conflicts.ps1`
- **Uso:** `powershell -ExecutionPolicy Bypass -File resolve_conflicts.ps1`
- **Função:** Resolve conflitos em arquivos específicos
- **Quando usar:** Quando há conflitos em arquivos específicos

## 🛠️ Estratégias Configuradas

### 1. Estratégia de Merge
- **Configuração:** `-X ours` - Prioriza suas alterações
- **Resultado:** Mantém suas alterações e integra as do remoto

### 2. Arquivos .gitattributes
- **Configuração:** Merge union para arquivos JS, TS, JSON
- **Resultado:** Combina automaticamente alterações compatíveis

### 3. Backup Automático
- **Configuração:** Stash automático antes de operações
- **Resultado:** Suas alterações ficam salvas em stash

## 🔍 Verificação de Conflitos

### Verificar se há conflitos:
```bash
git status
```

### Se aparecer `UU`, `AA`, ou `DD`:
```bash
# Execute o script de resolução
powershell -ExecutionPolicy Bypass -File git_no_conflicts_simple.ps1
```

## 📝 Comandos Manuais (Se necessário)

### 1. Resolver conflitos manualmente:
```bash
# Editar arquivo com conflitos
# Remover marcadores: <<<<<<< ======= >>>>>>>
# Salvar arquivo
git add .
git commit -m "resolve: conflitos resolvidos"
```

### 2. Restaurar alterações do stash:
```bash
# Ver alterações em stash
git stash list

# Restaurar alterações
git stash pop

# Ver diferenças
git stash show -p
```

## ⚠️ Situações Especiais

### 1. Se o script não resolver:
```bash
# Verificar status
git status

# Adicionar arquivos resolvidos
git add .

# Fazer commit
git commit -m "resolve: conflitos resolvidos manualmente"
```

### 2. Se houver conflitos em arquivos binários:
```bash
# Escolher uma versão
git checkout --ours arquivo.bin
# ou
git checkout --theirs arquivo.bin

# Adicionar e commitar
git add arquivo.bin
git commit -m "resolve: conflito em arquivo binário"
```

## 🎯 Resumo dos Comandos

| Situação | Comando |
|----------|---------|
| Conflito no pull | `powershell -ExecutionPolicy Bypass -File git_no_conflicts_simple.ps1` |
| Conflito no merge | `powershell -ExecutionPolicy Bypass -File git_safe_merge.ps1 -BranchName main` |
| Verificar status | `git status` |
| Ver stash | `git stash list` |
| Restaurar stash | `git stash pop` |

## ✅ Garantias

- ✅ **Suas alterações são sempre preservadas**
- ✅ **Backup automático antes de operações**
- ✅ **Resolução automática de conflitos**
- ✅ **Integração de alterações do remoto**
- ✅ **Nenhuma perda de código**

## 🆘 Em Caso de Problemas

1. **Execute o script simples:** `git_no_conflicts_simple.ps1`
2. **Verifique o status:** `git status`
3. **Se ainda houver conflitos:** Resolva manualmente
4. **Faça commit:** `git add . && git commit -m "resolve: conflitos"`

---

**💡 Dica:** Use sempre o script `git_no_conflicts_simple.ps1` para operações seguras!
