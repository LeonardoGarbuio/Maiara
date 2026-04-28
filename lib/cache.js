/**
 * TIA MAI - Sistema de Cache em Memória de Alta Performance (Sub-0.05ms)
 * 
 * Cache Layer com padrão Stale-While-Revalidate (SWR).
 * Se o dado existe na RAM (mesmo expirado), é retornado quase instantaneamente (<0.05ms).
 * A atualização com o banco ocorre em background (non-blocking).
 */

const _store = new Map();
const _pendingFetches = new Map();

const DEFAULT_TTL = 30_000; // 30 segundos

/**
 * Busca um valor do cache (modo estrito - sem SWR).
 */
export function cacheGet(key) {
  const entry = _store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Armazena um valor no cache.
 */
export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  _store.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Invalida uma chave específica.
 */
export function cacheInvalidate(key) {
  _store.delete(key);
}

/**
 * Invalida prefixo.
 */
export function cacheInvalidatePrefix(prefix) {
  for (const key of _store.keys()) {
    if (key.startsWith(prefix)) {
      _store.delete(key);
    }
  }
}

/**
 * Wrapper com Stale-While-Revalidate.
 * Retorna dados em < 0.05ms da RAM se existirem.
 */
export async function cacheGetOrFetch(key, fetchFn, ttl = DEFAULT_TTL) {
  const entry = _store.get(key);
  const isStale = entry ? Date.now() > entry.expiresAt : true;

  // Se precisamos atualizar e não tem um fetch rodando pra essa chave
  if (isStale && !_pendingFetches.has(key)) {
    const fetchPromise = (async () => {
      try {
        const fresh = await fetchFn();
        cacheSet(key, fresh, ttl);
      } catch (error) {
        console.error(`[SWR Cache Error] Falha ao revalidar ${key}:`, error);
      } finally {
        _pendingFetches.delete(key);
      }
    })();
    
    // Armazena a promise para evitar duplicatas de fetch
    _pendingFetches.set(key, fetchPromise);
  }

  // Retorna IMEDIATAMENTE se houver algo na memória (Mesmo Stale)
  if (entry) {
    return entry.value;
  }

  // Se não tinha nada na memória (Cold Start), aí sim aguardamos
  // e bloqueamos a execução para ter a primeira carga de dados.
  await _pendingFetches.get(key);
  return _store.get(key)?.value || null;
}
