import { PrismaClient } from "@prisma/client";

// Singleton para o Prisma Client - Padrao recomendado para Next.js
const globalForPrisma = globalThis;

/** @type {PrismaClient} */
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
