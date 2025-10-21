#!/usr/bin/env python3
"""
Script para instalar dependências do AI Model
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Executar comando e mostrar resultado"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Concluído")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Erro:")
        print(f"   {e.stderr}")
        return False

def check_venv():
    """Verificar se ambiente virtual existe"""
    if os.path.exists("venv"):
        print("✅ Ambiente virtual já existe")
        return True
    else:
        print("❌ Ambiente virtual não encontrado")
        return False

def create_venv():
    """Criar ambiente virtual"""
    return run_command(
        f"{sys.executable} -m venv venv",
        "Criando ambiente virtual"
    )

def activate_venv_command():
    """Retornar comando para ativar ambiente virtual"""
    if os.name == 'nt':  # Windows
        return "venv\\Scripts\\activate"
    else:  # Linux/Mac
        return "source venv/bin/activate"

def install_requirements():
    """Instalar dependências do requirements.txt"""
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Linux/Mac
        pip_cmd = "venv/bin/pip"
    
    return run_command(
        f"{pip_cmd} install -r requirements.txt",
        "Instalando dependências"
    )

def upgrade_pip():
    """Atualizar pip"""
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Linux/Mac
        pip_cmd = "venv/bin/pip"
    
    return run_command(
        f"{pip_cmd} install --upgrade pip",
        "Atualizando pip"
    )

def main():
    """Função principal"""
    print("🚀 Instalando dependências do AI Model...\n")
    
    # Verificar se requirements.txt existe
    if not os.path.exists("requirements.txt"):
        print("❌ Arquivo requirements.txt não encontrado!")
        print("   Execute este script no diretório ai_model")
        return False
    
    # Verificar se estamos no diretório correto
    if not os.path.exists("src/app.py"):
        print("❌ Arquivo src/app.py não encontrado!")
        print("   Execute este script no diretório ai_model")
        return False
    
    success = True
    
    # Criar ambiente virtual se não existir
    if not check_venv():
        success = create_venv() and success
    
    # Atualizar pip
    success = upgrade_pip() and success
    
    # Instalar dependências
    success = install_requirements() and success
    
    print("\n" + "="*50)
    if success:
        print("🎉 Instalação concluída com sucesso!")
        print("\n📋 Próximos passos:")
        print(f"   1. Ative o ambiente virtual:")
        print(f"      {activate_venv_command()}")
        print("   2. Execute o AI Model:")
        print("      uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload")
        print("   3. Ou use os scripts:")
        print("      start_local.bat (Windows) ou start_local.sh (Linux/Mac)")
    else:
        print("❌ Instalação falhou. Verifique os erros acima.")
    
    return success

if __name__ == "__main__":
    main()
