import { PrismaClient } from "@prisma/client";

// Singleton padrão do Prisma para Next.js
// A DATABASE_URL DEVE estar configurada nas Environment Variables do projeto na Vercel.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
