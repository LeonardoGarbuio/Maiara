/**
 * TIA MAI - Sistema de Cache em Memória de Alta Performance
 * 
 * Cache Layer que elimina latência de rede repetitiva.
 * Dados são servidos da RAM do servidor em <1ms ao invés de 
 * viajar até o Supabase (US East) a cada requisição.
 * 
 * Estratégia: Cache-Aside (Lazy Loading) com TTL + Invalidação Manual.
 */

const _store = new Map();

const DEFAULT_TTL = 30_000; // 30 segundos (dados atualizados a cada 30s no pior caso)

/**
 * Busca um valor do cache.
 * @param {string} key - Chave do cache
 * @returns {any|null} - Valor cacheado ou null se expirado/inexistente
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
 * @param {string} key - Chave do cache
 * @param {any} value - Valor a ser cacheado
 * @param {number} ttl - Tempo de vida em ms (padrão: 30s)
 */
export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  _store.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Invalida (remove) uma chave específica do cache.
 * @param {string} key - Chave a invalidar
 */
export function cacheInvalidate(key) {
  _store.delete(key);
}

/**
 * Invalida todas as chaves que começam com o prefixo.
 * Ex: cacheInvalidatePrefix("projects") limpa "projects:list", "projects:abc123", etc.
 * @param {string} prefix - Prefixo das chaves a invalidar
 */
export function cacheInvalidatePrefix(prefix) {
  for (const key of _store.keys()) {
    if (key.startsWith(prefix)) {
      _store.delete(key);
    }
  }
}

/**
 * Wrapper de conveniência: busca do cache ou executa a função e cacheia o resultado.
 * @param {string} key - Chave do cache 
 * @param {Function} fetchFn - Função async que busca os dados do banco
 * @param {number} ttl - TTL em ms
 * @returns {Promise<any>} - Dados (do cache ou frescos)
 */
export async function cacheGetOrFetch(key, fetchFn, ttl = DEFAULT_TTL) {
  const cached = cacheGet(key);
  if (cached !== null) return cached;
  
  const fresh = await fetchFn();
  cacheSet(key, fresh, ttl);
  return fresh;
}
