import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@mentora:matriculas_cache';
const CACHE_TIMESTAMP_KEY = '@mentora:matriculas_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

export interface CachedMatricula {
  IDMatricula: string;
  disciplina: {
    NomeDaDisciplina: string;
    CodigoDaDisciplina?: string | null;
  };
  periodo: {
    Nome: string;
  };
}

interface CacheData {
  matriculas: CachedMatricula[];
  studentId: string;
}

/**
 * Salva as matrículas no cache
 */
export async function saveMatriculasToCache(
  studentId: string,
  matriculas: CachedMatricula[]
): Promise<void> {
  try {
    const cacheData: CacheData = {
      matriculas,
      studentId,
    };
    
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    
  } catch (error) {
    console.error('❌ Erro ao salvar matrículas no cache:', error);
  }
}

/**
 * Busca as matrículas do cache
 */
export async function getMatriculasFromCache(
  studentId: string
): Promise<CachedMatricula[] | null> {
  try {
    // Verificar timestamp do cache
    const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestampStr) {
      return null;
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const cacheAge = now - timestamp;

    // Se o cache expirou, retornar null
    if (cacheAge > CACHE_DURATION) {
      await clearMatriculasCache();
      return null;
    }

    // Buscar dados do cache
    const cacheDataStr = await AsyncStorage.getItem(CACHE_KEY);
    if (!cacheDataStr) {
      return null;
    }

    const cacheData: CacheData = JSON.parse(cacheDataStr);

    // Verificar se o cache é do mesmo aluno
    if (cacheData.studentId !== studentId) {
      await clearMatriculasCache();
      return null;
    }

    return cacheData.matriculas;
  } catch (error) {
    console.error('❌ Erro ao buscar matrículas do cache:', error);
    return null;
  }
}

/**
 * Limpa o cache de matrículas
 */
export async function clearMatriculasCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
  }
}

/**
 * Verifica se o cache está válido (não expirado)
 */
export async function isCacheValid(studentId: string): Promise<boolean> {
  const cached = await getMatriculasFromCache(studentId);
  return cached !== null;
}

