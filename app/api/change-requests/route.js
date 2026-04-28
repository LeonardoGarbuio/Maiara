import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const documentId = searchParams.get("documentId");

    const where = {};
    if (projectId) where.projectId = projectId;
    if (documentId) where.documentId = documentId;

    const changeRequests = await prisma.changeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { name: true } },
        checklists: { orderBy: { taskDescription: 'asc' } },
        document: { select: { name: true } },
        project: { select: { name: true } }
      }
    });

    return NextResponse.json(changeRequests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 🔒 ADMIN e LEAD_ARCHITECT
    const auth = await requireAuth(request, ["ADMIN", "LEAD_ARCHITECT"]);
    if (auth.error) return auth.error;
    const user = auth.user;

    const { projectId, documentId, description, checklists } = await request.json();

    if (!description) {
      return NextResponse.json({ error: "A descrição da alteração é obrigatória." }, { status: 400 });
    }

    // Criar a Change Request e Checklists associadas numa só query
    const changeRequest = await prisma.changeRequest.create({
      data: {
        projectId: projectId || null,
        documentId: documentId || null,
        description,
        requestedBy: user.id,
        status: "PENDING",
        checklists: checklists && checklists.length > 0 ? {
          create: checklists.map(task => ({
            taskDescription: task
          }))
        } : undefined
      },
      include: {
        checklists: true
      }
    });

    // Se a alteração for específica para um documento, atualiza o status do documento para IN_ALTERATION
    if (documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "IN_ALTERATION" }
      });
    }

    return NextResponse.json(changeRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
