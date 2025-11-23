// Script para verificar se tudo está configurado corretamente
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔍 Verificando configuração do backend...\n');

let errors = [];
let warnings = [];

// 1. Verificar estrutura de diretórios ML
const mlDir = path.join(__dirname, 'src', 'ml');
const requiredPaths = {
  'ML Directory': mlDir,
  'Models Directory': path.join(mlDir, 'models'),
  'Pipelines Directory': path.join(mlDir, 'pipelines'),
  'Datasets Directory': path.join(mlDir, 'datasets'),
  'Dropout Script': path.join(mlDir, 'models', 'dropout_predict.py'),
  'Performance Script': path.join(mlDir, 'models', 'performance_predict.py'),
};

console.log('📁 Verificando estrutura de diretórios...');
Object.entries(requiredPaths).forEach(([name, filePath]) => {
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${name}: OK`);
  } else {
    console.log(`  ❌ ${name}: NÃO ENCONTRADO`);
    errors.push(`${name} não encontrado: ${filePath}`);
  }
});

// 2. Verificar modelos .pkl
console.log('\n🤖 Verificando modelos...');
const pipelineDir = path.join(mlDir, 'pipelines');
if (fs.existsSync(pipelineDir)) {
  const pklFiles = fs.readdirSync(pipelineDir).filter(f => f.endsWith('.pkl'));
  const requiredModels = [
    'dropout_preprocess.pkl',
    'dropout_logreg_model.pkl',
    'perf_preprocess.pkl',
    'perf_logreg_model.pkl',
    'perf_rf_model.pkl'
  ];
  
  requiredModels.forEach(model => {
    if (pklFiles.includes(model)) {
      console.log(`  ✅ ${model}: OK`);
    } else {
      console.log(`  ❌ ${model}: NÃO ENCONTRADO`);
      errors.push(`Modelo ${model} não encontrado`);
    }
  });
} else {
  errors.push('Diretório pipelines não encontrado');
}

// 3. Verificar datasets
console.log('\n📊 Verificando datasets...');
const datasetsDir = path.join(mlDir, 'datasets');
if (fs.existsSync(datasetsDir)) {
  const csvFiles = fs.readdirSync(datasetsDir).filter(f => f.endsWith('.csv'));
  if (csvFiles.includes('StudentPerformanceFactors.csv')) {
    console.log('  ✅ StudentPerformanceFactors.csv: OK');
  } else {
    console.log('  ❌ StudentPerformanceFactors.csv: NÃO ENCONTRADO');
    errors.push('Dataset StudentPerformanceFactors.csv não encontrado');
  }
} else {
  errors.push('Diretório datasets não encontrado');
}

// 4. Verificar Python
console.log('\n🐍 Verificando Python...');
function checkPython() {
  return new Promise((resolve) => {
    const python = spawn('python', ['--version']);
    python.on('close', (code) => {
      if (code === 0) {
        console.log('  ✅ Python: OK (python)');
        resolve(true);
      } else {
        const python3 = spawn('python3', ['--version']);
        python3.on('close', (code3) => {
          if (code3 === 0) {
            console.log('  ✅ Python: OK (python3)');
            resolve(true);
          } else {
            console.log('  ❌ Python: NÃO ENCONTRADO');
            errors.push('Python não está instalado ou não está no PATH');
            resolve(false);
          }
        });
        python3.on('error', () => {
          console.log('  ❌ Python: NÃO ENCONTRADO');
          errors.push('Python não está instalado ou não está no PATH');
          resolve(false);
        });
      }
    });
    python.on('error', () => {
      const python3 = spawn('python3', ['--version']);
      python3.on('close', (code3) => {
        if (code3 === 0) {
          console.log('  ✅ Python: OK (python3)');
          resolve(true);
        } else {
          console.log('  ❌ Python: NÃO ENCONTRADO');
          errors.push('Python não está instalado ou não está no PATH');
          resolve(false);
        }
      });
      python3.on('error', () => {
        console.log('  ❌ Python: NÃO ENCONTRADO');
        errors.push('Python não está instalado ou não está no PATH');
        resolve(false);
      });
    });
  });
}

// 5. Verificar node_modules
console.log('\n📦 Verificando dependências Node.js...');
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('  ✅ node_modules: OK');
} else {
  warnings.push('node_modules não encontrado. Execute: npm install');
  console.log('  ⚠️  node_modules: NÃO ENCONTRADO (execute: npm install)');
}

// 6. Verificar .env
console.log('\n🔐 Verificando configuração...');
if (fs.existsSync(path.join(__dirname, '.env'))) {
  console.log('  ✅ .env: OK');
} else {
  warnings.push('.env não encontrado. Pode ser necessário criar um arquivo .env');
  console.log('  ⚠️  .env: NÃO ENCONTRADO (pode ser necessário)');
}

// Executar verificações assíncronas
(async () => {
  await checkPython();
  
  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMO');
  console.log('='.repeat(50));
  
  if (errors.length === 0) {
    console.log('✅ Tudo configurado corretamente!');
    if (warnings.length > 0) {
      console.log('\n⚠️  Avisos:');
      warnings.forEach(w => console.log(`  - ${w}`));
    }
    console.log('\n🚀 Você pode rodar o backend com: npm run dev');
  } else {
    console.log('❌ Erros encontrados:');
    errors.forEach(e => console.log(`  - ${e}`));
    if (warnings.length > 0) {
      console.log('\n⚠️  Avisos:');
      warnings.forEach(w => console.log(`  - ${w}`));
    }
    process.exit(1);
  }
})();

