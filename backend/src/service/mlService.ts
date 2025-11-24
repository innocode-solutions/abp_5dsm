import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Resolve o caminho do ML de forma robusta
// Em dev (ts-node): __dirname = backend/src/service
// Em produção (compilado): __dirname = backend/dist/src/service
// Precisamos sempre chegar em backend/src/ml
function getMLDir(): string {
  const currentDir = __dirname;
  
  // Se estamos em dist/, voltamos para a raiz do backend (app/)
  if (currentDir.includes(path.join('dist', 'src'))) {
    // currentDir: /app/dist/src/service
    // .. -> /app/dist/src
    // .. -> /app/dist
    // .. -> /app
    // src/ml -> /app/src/ml
    return path.resolve(currentDir, '../../../src/ml');
  }
  
  // Se estamos em src/service (dev), voltamos 2 níveis e entramos em src/ml
  return path.resolve(currentDir, '../ml');
}

const ML_DIR = getMLDir();

// Verifica se os arquivos Python existem
const PYTHON_SCRIPTS = {
  dropout: path.join(ML_DIR, 'models', 'dropout_predict.py'),
  performance: path.join(ML_DIR, 'models', 'performance_predict.py')
};

// Verifica se os modelos existem
const MODEL_PATHS = {
  dropoutPreprocess: path.join(ML_DIR, 'pipelines', 'dropout_preprocess.pkl'),
  dropoutModel: path.join(ML_DIR, 'pipelines', 'dropout_logreg_model.pkl'),
  perfPreprocess: path.join(ML_DIR, 'pipelines', 'perf_preprocess.pkl'),
  perfLogreg: path.join(ML_DIR, 'pipelines', 'perf_logreg_model.pkl'),
  perfRF: path.join(ML_DIR, 'pipelines', 'perf_rf_model.pkl'),
  perfDataset: path.join(ML_DIR, 'datasets', 'StudentPerformanceFactors.csv')
};

// Verifica se Python está disponível
function checkPythonAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const commands = process.platform === 'win32' 
      ? ['py', 'python3', 'python']  // Windows: tenta py primeiro
      : ['python3', 'python'];        // Linux/Mac: tenta python3 primeiro
    
    let currentIndex = 0;
    
    function tryNext() {
      if (currentIndex >= commands.length) {
        resolve(false);
        return;
      }
      
      const cmd = commands[currentIndex++];
      const python = spawn(cmd, ['--version']);
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          tryNext();
        }
      });
      
      python.on('error', () => {
        tryNext();
      });
      
      // Timeout de segurança
      setTimeout(() => {
        python.kill();
        tryNext();
      }, 2000);
    }
    
    tryNext();
  });
}

function getPythonCommand(): string {
  // No Windows, tenta várias opções para evitar o alias da Microsoft Store
  if (process.platform === 'win32') {
    // Ordem de tentativa no Windows:
    // 1. py (launcher do Python)
    // 2. python3
    // 3. python (pode ser o alias da Microsoft Store)
    return 'py'; // Launcher do Python no Windows é mais confiável
  }
  // Linux/Mac
  return 'python3';
}

interface DropoutPredictionResult {
  probability_dropout: number;
  class_dropout: string;
  explain: string;
}

interface PerformancePredictionResult {
  predicted_score: number;
  confidence: number;
  is_approved: boolean;
  approval_status: string;
  grade_category: string;
  factors: Array<{
    feature: string;
    value: number | string;
    influence: string;
  }>;
  saved: boolean;
}

/**
 * Executa um script Python e retorna o resultado
 */
function executePythonScript(
  scriptPath: string,
  inputData: any,
  timeout: number = 30000
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Verifica se o script existe
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`Script Python não encontrado: ${scriptPath}`));
      return;
    }

    // Tenta encontrar o comando Python correto
    const pythonCmd = getPythonCommand();
    
    // No Windows, usa shell para melhor compatibilidade
    const pythonProcess = spawn(pythonCmd, [scriptPath], {
      cwd: ML_DIR,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      shell: process.platform === 'win32' // No Windows, usa shell para evitar problemas com aliases
    });

    let stdout = '';
    let stderr = '';

    // Envia dados via stdin
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Timeout ao executar script Python'));
    }, timeout);

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      
      if (code !== 0) {
        // No Windows, código 9009 significa "comando não encontrado"
        if (process.platform === 'win32' && code === 9009) {
          // Tenta outros comandos Python automaticamente
          if (pythonCmd === 'py') {
            // Se py falhou, tenta python3
            const python3Process = spawn('python3', [scriptPath], {
              cwd: ML_DIR,
              env: { ...process.env, PYTHONUNBUFFERED: '1' },
              shell: true
            });
            
            let stdout3 = '';
            let stderr3 = '';
            
            python3Process.stdin.write(JSON.stringify(inputData));
            python3Process.stdin.end();
            
            python3Process.stdout.on('data', (data) => {
              stdout3 += data.toString();
            });
            
            python3Process.stderr.on('data', (data) => {
              stderr3 += data.toString();
            });
            
            const timeoutId3 = setTimeout(() => {
              python3Process.kill();
              reject(new Error('Timeout ao executar script Python'));
            }, timeout);
            
            python3Process.on('close', (code3) => {
              clearTimeout(timeoutId3);
              
              if (code3 !== 0) {
                reject(new Error(`Python não encontrado. Código: ${code3}. Erro: ${stderr3}\n\nSolução: Instale Python 3.x de https://www.python.org/downloads/ e marque "Add Python to PATH" durante a instalação.`));
                return;
              }
              
              try {
                const lines = stdout3.trim().split('\n');
                let jsonOutput = '';
                for (let i = lines.length - 1; i >= 0; i--) {
                  const line = lines[i].trim();
                  if (line.startsWith('{') || line.startsWith('[')) {
                    jsonOutput = line;
                    break;
                  }
                }
                
                if (!jsonOutput) {
                  jsonOutput = stdout3.trim();
                }
                
                const result = JSON.parse(jsonOutput);
                resolve(result);
              } catch (parseError) {
                reject(new Error(`Erro ao parsear saída do Python: ${stdout3}\nErro: ${parseError}`));
              }
            });
            
            python3Process.on('error', () => {
              clearTimeout(timeoutId3);
              reject(new Error(`Python não encontrado. Instale Python 3.x de https://www.python.org/downloads/`));
            });
            
            return; // Não rejeita, deixa python3 tentar
          }
        }
        
        reject(new Error(`Script Python falhou com código ${code}: ${stderr}`));
        return;
      }

      try {
        // Tenta parsear o JSON da saída
        const lines = stdout.trim().split('\n');
        // Procura pela última linha que parece ser JSON
        let jsonOutput = '';
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') || line.startsWith('[')) {
            jsonOutput = line;
            break;
          }
        }
        
        if (!jsonOutput) {
          // Se não encontrou JSON, tenta parsear toda a saída
          jsonOutput = stdout.trim();
        }

        const result = JSON.parse(jsonOutput);
        resolve(result);
      } catch (error) {
        reject(new Error(`Erro ao parsear saída do Python: ${stdout}\nErro: ${error}`));
      }
    });

    pythonProcess.on('error', (error) => {
      clearTimeout(timeoutId);
      
      // No Windows, se 'py' falhar, tenta 'python' ou 'python3'
      if (process.platform === 'win32' && pythonCmd === 'py') {
        // Tenta python3
        const python3Process = spawn('python3', [scriptPath], {
          cwd: ML_DIR,
          env: { ...process.env, PYTHONUNBUFFERED: '1' },
          shell: true
        });
        
        // Reutiliza a mesma lógica de stdout/stderr
        let stdout3 = '';
        let stderr3 = '';
        
        python3Process.stdin.write(JSON.stringify(inputData));
        python3Process.stdin.end();
        
        python3Process.stdout.on('data', (data) => {
          stdout3 += data.toString();
        });
        
        python3Process.stderr.on('data', (data) => {
          stderr3 += data.toString();
        });
        
        const timeoutId3 = setTimeout(() => {
          python3Process.kill();
          reject(new Error('Timeout ao executar script Python'));
        }, timeout);
        
        python3Process.on('close', (code) => {
          clearTimeout(timeoutId3);
          
          if (code !== 0) {
            reject(new Error(`Script Python falhou com código ${code}: ${stderr3 || error.message}`));
            return;
          }
          
          try {
            const lines = stdout3.trim().split('\n');
            let jsonOutput = '';
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('{') || line.startsWith('[')) {
                jsonOutput = line;
                break;
              }
            }
            
            if (!jsonOutput) {
              jsonOutput = stdout3.trim();
            }
            
            const result = JSON.parse(jsonOutput);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Erro ao parsear saída do Python: ${stdout3}\nErro: ${parseError}`));
          }
        });
        
        python3Process.on('error', () => {
          clearTimeout(timeoutId3);
          // Última tentativa: python (pode ser o alias da Microsoft Store, mas vamos tentar)
          const pythonProcess2 = spawn('python', [scriptPath], {
            cwd: ML_DIR,
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
            shell: true
          });
          
          let stdout2 = '';
          let stderr2 = '';
          
          pythonProcess2.stdin.write(JSON.stringify(inputData));
          pythonProcess2.stdin.end();
          
          pythonProcess2.stdout.on('data', (data) => {
            stdout2 += data.toString();
          });
          
          pythonProcess2.stderr.on('data', (data) => {
            stderr2 += data.toString();
          });
          
          const timeoutId2 = setTimeout(() => {
            pythonProcess2.kill();
            reject(new Error('Timeout ao executar script Python'));
          }, timeout);
          
          pythonProcess2.on('close', (code) => {
            clearTimeout(timeoutId2);
            
            if (code !== 0) {
              reject(new Error(`Python não encontrado. Código: ${code}. Erro: ${stderr2 || error.message}\n\nSolução: Instale Python 3.x de https://www.python.org/downloads/ e certifique-se de marcar "Add Python to PATH" durante a instalação.`));
              return;
            }
            
            try {
              const lines = stdout2.trim().split('\n');
              let jsonOutput = '';
              for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith('{') || line.startsWith('[')) {
                  jsonOutput = line;
                  break;
                }
              }
              
              if (!jsonOutput) {
                jsonOutput = stdout2.trim();
              }
              
              const result = JSON.parse(jsonOutput);
              resolve(result);
            } catch (parseError) {
              reject(new Error(`Erro ao parsear saída do Python: ${stdout2}\nErro: ${parseError}`));
            }
          });
          
          pythonProcess2.on('error', () => {
            clearTimeout(timeoutId2);
            reject(new Error(`Python não encontrado. Tente:\n1. Instalar Python 3.x de https://www.python.org/downloads/\n2. Marcar "Add Python to PATH" durante a instalação\n3. Reiniciar o terminal após instalar\n\nErro original: ${error.message}`));
          });
        });
        
        return; // Não rejeita imediatamente, deixa o python3 tentar
      }
      
      reject(new Error(`Erro ao executar Python: ${error.message}\n\nSolução: Instale Python 3.x e certifique-se de que está no PATH.`));
    });
  });
}

/**
 * Prediz risco de evasão usando o modelo Python
 */
export async function predictDropout(data: any): Promise<DropoutPredictionResult> {
  try {
    const result = await executePythonScript(PYTHON_SCRIPTS.dropout, data);
    return result as DropoutPredictionResult;
  } catch (error: any) {
    throw new Error(`Erro ao prever evasão: ${error.message}`);
  }
}

/**
 * Prediz desempenho acadêmico usando o modelo Python
 */
export async function predictPerformance(data: any): Promise<PerformancePredictionResult> {
  try {
    const result = await executePythonScript(PYTHON_SCRIPTS.performance, data);
    return result as PerformancePredictionResult;
  } catch (error: any) {
    throw new Error(`Erro ao prever desempenho: ${error.message}`);
  }
}

/**
 * Verifica se o serviço ML está disponível
 */
export async function checkMLServiceHealth(): Promise<{
  available: boolean;
  pythonAvailable: boolean;
  scriptsAvailable: boolean;
  modelsAvailable: boolean;
  message: string;
}> {
  const pythonAvailable = await checkPythonAvailable();
  const scriptsAvailable = Object.values(PYTHON_SCRIPTS).every(script => 
    fs.existsSync(script)
  );
  const modelsAvailable = Object.values(MODEL_PATHS).every(modelPath =>
    fs.existsSync(modelPath)
  );

  return {
    available: pythonAvailable && scriptsAvailable && modelsAvailable,
    pythonAvailable,
    scriptsAvailable,
    modelsAvailable,
    message: pythonAvailable && scriptsAvailable && modelsAvailable
      ? 'Serviço ML disponível'
      : `Serviço ML indisponível: Python=${pythonAvailable}, Scripts=${scriptsAvailable}, Modelos=${modelsAvailable}`
  };
}

