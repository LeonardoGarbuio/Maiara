import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/clients/[id] - Busca um cliente
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          include: { phases: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Atualiza um cliente
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        notes: body.notes,
      },
    });
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Deleta um cliente
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
