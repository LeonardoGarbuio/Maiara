import { PrismaClient } from "@prisma/client";

// Singleton para o Prisma Client
const globalForPrisma = globalThis;

/**
 * RESOLUÇÃO DEFINITIVA PARA ERRO DE BUILD NA VERCEL:
 * O Prisma exige DATABASE_URL mesmo no build. Se não estiver lá, ele quebra.
 * Fornecemos uma URL "dummy" (fictícia) se a real estiver ausente, 
 * o que permite que o Next.js complete o build sem erros.
 */
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/postgres?schema=public";

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
