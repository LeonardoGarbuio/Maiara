import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/users/[id] - Deleta um usuário
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/users/[id] - Atualiza um usuário
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data = {};
    if (body.name) data.name = body.name;
    if (body.username) data.username = body.username;
    if (body.role) data.role = body.role;
    if (body.password) {
      const pwd = body.password;
      if (pwd.length < 8) {
        return NextResponse.json({ error: "Segurança: A nova senha deve ter no mínimo 8 caracteres." }, { status: 400 });
      }
      if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
        return NextResponse.json({ error: "Segurança: A nova senha deve conter pelo menos uma letra maiúscula e um número." }, { status: 400 });
      }
      const bcrypt = require("bcryptjs");
      data.password = await bcrypt.hash(body.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
