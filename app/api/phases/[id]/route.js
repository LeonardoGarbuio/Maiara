import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT /api/phases/[id] - Atualiza status de uma fase (Estagiários usarão isso)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Busca a fase atual para saber o ID do projeto e salvar no histórico
    const currentPhase = await prisma.phase.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!currentPhase) {
      return NextResponse.json({ error: "Fase não encontrada" }, { status: 404 });
    }

    // Salva no histórico se houver um usuário identificado
    if (body.userId) {
      await prisma.projectHistory.create({
        data: {
          projectId: currentPhase.projectId,
          dataSnapshot: {
            phaseId: id,
            phaseName: currentPhase.name,
            oldStatus: currentPhase.status,
            newStatus: body.status,
            justification: body.justification || null
          },
          changedBy: body.userId,
        },
      });
    }

    const phase = await prisma.phase.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        justification: body.justification ?? undefined,
      },
    });

    return NextResponse.json(phase);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
