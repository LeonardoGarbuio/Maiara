import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// GET /api/users - Lista todos os usuários
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        createdAt: true,
        createdBy: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/users - Cria novo usuário (Admin cria estagiários/admins)
export async function POST(request) {
  try {
    const body = await request.json();

    // Limpar whitespaces e padronizar minúsculas
    const cleanUsername = body.username.trim().toLowerCase();

    // Verificar se username já existe
    const exists = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (exists) {
      return NextResponse.json({ error: "Este usuário já está cadastrado" }, { status: 409 });
    }

    // Política de Senhas Nacional: Complexidade
    const pwd = body.password;
    if (pwd.length < 8) {
      return NextResponse.json({ error: "Segurança: A senha deve ter no mínimo 8 caracteres." }, { status: 400 });
    }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      return NextResponse.json({ error: "Segurança: A senha deve conter pelo menos uma letra maiúscula e um número para proteção contra força bruta." }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        username: cleanUsername,
        password: hashedPassword,
        role: body.role || "TEAM",
        createdBy: body.createdBy || null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
