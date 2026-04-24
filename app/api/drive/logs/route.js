import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tiamai_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}
export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas administradores podem ver o histórico" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId ausente" }, { status: 400 });
    }

    const logs = await prisma.driveActivityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: true } }
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const { projectId, action, targetName } = body;

    if (!projectId || !action || !targetName) {
      return NextResponse.json({ error: "Dados ausentes" }, { status: 400 });
    }

    const log = await prisma.driveActivityLog.create({
      data: {
        projectId,
        action,
        targetName,
        userId: user.id
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
