import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cacheGetOrFetch, cacheInvalidatePrefix } from "@/lib/cache";
import { requireAuth } from "@/lib/api-auth";

// GET /api/clients - Lista todos os clientes
export async function GET(request) {
  try {
    // 🔒 Qualquer usuário autenticado pode ver clientes
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const clients = await cacheGetOrFetch("clients:list", async () => {
      return await prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          projects: {
            select: { id: true, name: true, status: true },
          },
        },
      });
    }, 30_000); // 30s TTL
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients - Cria um novo cliente
export async function POST(request) {
  try {
    // 🔒 ADMIN ONLY
    const auth = await requireAuth(request, "ADMIN");
    if (auth.error) return auth.error;

    const body = await request.json();
    const client = await prisma.client.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
      },
    });
    cacheInvalidatePrefix("clients");
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
