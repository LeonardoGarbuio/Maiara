import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

let _prisma;

if (process.env.NODE_ENV === "production") {
  _prisma = new PrismaClient();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  _prisma = globalForPrisma.prisma;
}

const prisma = _prisma;
export default prisma;
