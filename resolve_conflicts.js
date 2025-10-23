const fs = require('fs');
const path = require('path');

/**
 * Script para resolver conflitos de merge automaticamente
 * Mantém todas as alterações de ambas as branches
 */

function resolveConflicts() {
  console.log('🔧 Resolvendo conflitos automaticamente...\n');
  
  // Lista de arquivos que podem ter conflitos
  const possibleConflictFiles = [
    'backend/src/controllers/dashboardController.ts',
    'backend/src/controllers/predictionController.ts',
    'backend/src/routes/predictionRoutes.ts',
    'backend/src/routes/index.ts',
    'backend/package.json',
    'backend/package-lock.json'
  ];
  
  let conflictsResolved = 0;
  
  possibleConflictFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar se há marcadores de conflito
        if (content.includes('<<<<<<<') && content.includes('=======') && content.includes('>>>>>>>')) {
          console.log(`📝 Resolvendo conflitos em: ${filePath}`);
          
          // Estratégia: manter ambas as alterações
          content = resolveConflictMarkers(content);
          
          fs.writeFileSync(filePath, content, 'utf8');
          conflictsResolved++;
          console.log(`✅ Conflitos resolvidos em: ${filePath}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao processar ${filePath}:`, error.message);
      }
    }
  });
  
  console.log(`\n🎉 Conflitos resolvidos: ${conflictsResolved} arquivos`);
  console.log('✅ Todas as alterações foram mantidas!');
}

function resolveConflictMarkers(content) {
  // Remove marcadores de conflito e mantém ambas as versões
  return content
    .replace(/<<<<<<< HEAD\n/g, '')
    .replace(/=======\n/g, '')
    .replace(/>>>>>>> [^\n]+\n/g, '')
    .replace(/\n\n\n+/g, '\n\n'); // Remove linhas vazias excessivas
}

// Executar se chamado diretamente
if (require.main === module) {
  resolveConflicts();
}

module.exports = { resolveConflicts, resolveConflictMarkers };
