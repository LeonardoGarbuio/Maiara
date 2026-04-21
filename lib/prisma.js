import { PrismaClient } from "@prisma/client";

// Singleton pragmático para evitar múltiplas conexões em desenvolvimento
// e evitar erros de "DATABASE_URL missing" durante o build da Vercel.
const globalForPrisma = globalThis;

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  // Se não houver URL e estiver em produção (instância de build),
  // retornamos um Proxy vazio que só vai "explodir" se for usado.
  if (!url && process.env.NODE_ENV === "production") {
    console.log("⚠️ DATABASE_URL ausente no build. Prisma operando em modo Lazy.");
    return new Proxy({}, {
      get: (target, prop) => {
        // Se pedir .then ou algo de Promise, retornamos algo inofensivo
        if (prop === 'then') return undefined;
        return () => {
          throw new Error(`Prisma: DATABASE_URL ausente. Falha ao acessar "${String(prop)}".`);
        };
      }
    });
  }

  return new PrismaClient();
}

const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
