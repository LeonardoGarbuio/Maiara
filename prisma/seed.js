import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Limpando banco de dados...");
  
  // Clean all existing data to ensure it's empty
  await prisma.projectHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 Criando usuário administrador principal...");

  const adminUsername = "Maiara";
  const adminPassword = await bcrypt.hash("Helena", 10);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      password: adminPassword,
      name: "Maiara",
      role: "ADMIN",
    },
    create: {
      username: adminUsername,
      name: "Maiara",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  
  console.log("✅ Admin criada: Usuário Maiara / Senha Helena");
  console.log("🎉 Banco de dados resetado! Pronto para uso limpo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
