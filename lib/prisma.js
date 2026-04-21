import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

/**
 * RESOLUÇÃO FINAL E ESTÁVEL:
 * Usamos um Singleton com inicialização tardia (Lazy).
 * O PrismaClient só é criado no momento do primeiro acesso real.
 * Isso evita que o build da Vercel quebre ao tentar carregar o módulo,
 * e garante que no runtime ele use a DATABASE_URL correta.
 */
let _prisma;

const prisma = new Proxy({}, {
  get(target, prop) {
    if (prop === "then") return undefined; // Proteção para Promises
    
    if (!_prisma) {
      const url = process.env.DATABASE_URL;
      
      if (!url) {
        // Se ainda não houver URL (ex: durante o build), retornamos um objeto que 
        // falhará apenas se uma operação de banco for realmente chamada.
        if (process.env.NODE_ENV === "production") {
            console.warn("⚠️ DATABASE_URL não encontrada. O Prisma falhará se houver chamadas ao banco agora.");
        }
      }
      
      _prisma = new PrismaClient();
    }
    
    return _prisma[prop];
  }
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = _prisma;
}

export default prisma;
