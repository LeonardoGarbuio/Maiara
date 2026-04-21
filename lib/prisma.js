import { PrismaClient } from "@prisma/client";

// Singleton para o Prisma Client
const globalForPrisma = globalThis;

/**
 * RESOLUÇÃO FINAL PARA ERRO DE BUILD NA VERCEL:
 * 1. Fornecemos uma URL dummy para inicialização.
 * 2. Usamos um Proxy para interceptar chamadas ao banco durante o build.
 *    Se o banco for acessado SEM uma DATABASE_URL real, ele retorna um objeto vazio
 *    em vez de tentar conectar e derrubar o build.
 */
const realUrl = process.env.DATABASE_URL;
const dummyUrl = "postgresql://dummy:dummy@localhost:5432/dummy";

let prismaInstance;

if (realUrl) {
  prismaInstance = new PrismaClient({
    datasources: { db: { url: realUrl } },
  });
} else {
  // Modo Build: Proteção contra chamadas acidentais
  const mockClient = new PrismaClient({
    datasources: { db: { url: dummyUrl } },
  });

  prismaInstance = new Proxy(mockClient, {
    get(target, prop) {
      // Se for um modelo do Prisma (ex: user, project)
      if (typeof target[prop] === 'object' && target[prop] !== null) {
        return new Proxy(target[prop], {
          get(modelTarget, modelProp) {
            // Se for um método de query (ex: findUnique, findMany)
            if (typeof modelTarget[modelProp] === 'function') {
              return async () => {
                console.log(`⚠️ Prisma: Chamada a "${String(prop)}.${String(modelProp)}" bloqueada durante o build (sem DATABASE_URL).`);
                return null; // Retorna null para não quebrar a lógica, mas não tenta conectar.
              };
            }
            return modelTarget[modelProp];
          }
        });
      }
      return target[prop];
    }
  });
}

const prisma = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
