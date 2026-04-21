// ==========================================
// AUTO-CRIAÇÃO DO ADMIN PADRÃO
// Se a Maiara for deletada do banco, ela é
// recriada automaticamente no próximo login.
// ==========================================

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "Maiara";
const ADMIN_NAME = "Maiara";
const ADMIN_PASSWORD = "Helena";

/**
 * Garante que a usuária admin "Maiara" exista no banco.
 * Se não existir, cria automaticamente.
 * Retorna o usuário admin (sem a senha).
 */
export async function ensureAdmin() {
  let admin = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      avatarUrl: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        createdAt: true,
      },
    });
    console.log("🔄 Admin Maiara recriada automaticamente.");
  }

  return admin;
}
