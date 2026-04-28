import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request) {
  try {
    // 🔒 ADMIN ONLY
    const auth = await requireAuth(request, "ADMIN");
    if (auth.error) return auth.error;

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
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const user = auth.user;

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
