#!/usr/bin/env python3
"""
Script simples para verificar se o sistema está pronto para rodar o AI Model
"""

import sys
import os
from pathlib import Path

def check_python_version():
    """Verificar versão do Python"""
    print("Verificando versão do Python...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 11:
        print(f"OK - Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"ERRO - Python {version.major}.{version.minor}.{version.micro} - Requer Python 3.11+")
        return False

def check_required_files():
    """Verificar se os arquivos necessários existem"""
    print("\nVerificando arquivos necessários...")
    
    required_files = [
        "src/app.py",
        "requirements.txt",
        "src/models/dropout_service.py",
        "src/models/preview.py"
    ]
    
    missing_files = []
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"OK - {file_path}")
        else:
            print(f"ERRO - {file_path} - AUSENTE")
            missing_files.append(file_path)
    
    return len(missing_files) == 0

def check_dependencies():
    """Verificar dependências principais"""
    print("\nVerificando dependências principais...")
    
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
            __import__(dep)
            print(f"OK - {dep}")
        except ImportError:
            print(f"ERRO - {dep} - NAO INSTALADO")
            missing_deps.append(dep)
    
    return len(missing_deps) == 0

def check_port_availability():
    """Verificar se a porta 5000 está disponível"""
    print("\nVerificando porta 5000...")
    import socket
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 5000))
        sock.close()
        
        if result == 0:
            print("AVISO - Porta 5000 já está em uso")
            return False
        else:
            print("OK - Porta 5000 disponível")
            return True
    except Exception as e:
        print(f"ERRO - Erro ao verificar porta: {e}")
        return False

def main():
    """Função principal"""
    print("=== VERIFICACAO DO SISTEMA AI MODEL ===\n")
    
    checks = [
        ("Python Version", check_python_version),
        ("Required Files", check_required_files),
        ("Dependencies", check_dependencies),
        ("Port 5000", check_port_availability)
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"ERRO ao verificar {name}: {e}")
            results.append((name, False))
    
    # Resumo
    print("\n" + "="*50)
    print("RESUMO DA VERIFICACAO")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for name, result in results:
        status = "PASSOU" if result else "FALHOU"
        print(f"{name}: {status}")
        if result:
            passed += 1
    
    print(f"\nResultado: {passed}/{total} verificacoes passaram")
    
    if passed == total:
        print("\nSISTEMA PRONTO! Voce pode executar:")
        print("   uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload")
    elif passed >= total - 1:
        print("\nSISTEMA QUASE PRONTO. Alguns avisos, mas deve funcionar.")
    else:
        print("\nSISTEMA NAO ESTA PRONTO. Corrija os problemas antes de continuar.")
        print("\nDICAS:")
        print("   1. Instale Python 3.11+ se necessario")
        print("   2. Execute: pip install -r requirements.txt")

if __name__ == "__main__":
    main()
