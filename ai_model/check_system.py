#!/usr/bin/env python3
"""
Script para verificar se o sistema está pronto para rodar o AI Model
"""

import sys
import subprocess
import importlib
import os
from pathlib import Path

def check_python_version():
    """Verificar versão do Python"""
    print("🐍 Verificando versão do Python...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 11:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} - Requer Python 3.11+")
        return False

def check_required_files():
    """Verificar se os arquivos necessários existem"""
    print("\n📁 Verificando arquivos necessários...")
    
    required_files = [
        "src/app.py",
        "requirements.txt",
        "src/models/dropout_service.py",
        "src/models/preview.py",
        "src/datasets/StudentPerformanceFactors.csv",
        "src/datasets/xAPI_dropout.csv"
    ]
    
    missing_files = []
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - AUSENTE")
            missing_files.append(file_path)
    
    return len(missing_files) == 0

def check_pip():
    """Verificar se pip está disponível"""
    print("\n📦 Verificando pip...")
    try:
        import pip
        print("✅ pip disponível")
        return True
    except ImportError:
        print("❌ pip não encontrado")
        return False

def check_dependencies():
    """Verificar dependências principais"""
    print("\n🔍 Verificando dependências principais...")
    
    main_deps = [
        "fastapi",
        "uvicorn", 
        "pandas",
        "numpy",
        "scikit-learn",
        "joblib"
    ]
    
    missing_deps = []
    for dep in main_deps:
        try:
            importlib.import_module(dep)
            print(f"✅ {dep}")
        except ImportError:
            print(f"❌ {dep} - NÃO INSTALADO")
            missing_deps.append(dep)
    
    return len(missing_deps) == 0

def check_model_files():
    """Verificar se os arquivos de modelo existem"""
    print("\n🤖 Verificando arquivos de modelo...")
    
    model_files = [
        "src/pipelines/dropout_preprocess.pkl",
        "src/pipelines/dropout_logreg_model.pkl",
        "src/pipelines/perf_preprocess.pkl",
        "src/pipelines/perf_logreg_model.pkl",
        "src/pipelines/perf_rf_model.pkl"
    ]
    
    missing_models = []
    for model_file in model_files:
        if os.path.exists(model_file):
            print(f"✅ {model_file}")
        else:
            print(f"❌ {model_file} - AUSENTE")
            missing_models.append(model_file)
    
    if missing_models:
        print("\n⚠️  Alguns modelos estão ausentes. O sistema pode não funcionar completamente.")
        print("   Execute o treinamento dos modelos primeiro.")
    
    return len(missing_models) == 0

def check_port_availability():
    """Verificar se a porta 5000 está disponível"""
    print("\n🔌 Verificando porta 5000...")
    import socket
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 5000))
        sock.close()
        
        if result == 0:
            print("⚠️  Porta 5000 já está em uso")
            return False
        else:
            print("✅ Porta 5000 disponível")
            return True
    except Exception as e:
        print(f"❌ Erro ao verificar porta: {e}")
        return False

def main():
    """Função principal"""
    print("Verificando sistema para AI Model...\n")
    
    checks = [
        ("Python Version", check_python_version),
        ("Required Files", check_required_files),
        ("Pip", check_pip),
        ("Dependencies", check_dependencies),
        ("Model Files", check_model_files),
        ("Port 5000", check_port_availability)
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ Erro ao verificar {name}: {e}")
            results.append((name, False))
    
    # Resumo
    print("\n" + "="*50)
    print("📊 RESUMO DA VERIFICAÇÃO")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{name}: {status}")
        if result:
            passed += 1
    
    print(f"\nResultado: {passed}/{total} verificações passaram")
    
    if passed == total:
        print("\n🎉 Sistema pronto! Você pode executar:")
        print("   python -m uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload")
        print("   ou use os scripts: start_local.bat (Windows) ou start_local.sh (Linux/Mac)")
    elif passed >= total - 1:
        print("\n⚠️  Sistema quase pronto. Alguns avisos, mas deve funcionar.")
    else:
        print("\n🚨 Sistema não está pronto. Corrija os problemas antes de continuar.")
        print("\n💡 Dicas:")
        print("   1. Instale Python 3.11+ se necessário")
        print("   2. Execute: pip install -r requirements.txt")
        print("   3. Verifique se todos os arquivos estão presentes")

if __name__ == "__main__":
    main()
