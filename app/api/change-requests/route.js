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
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas administradores podem solicitar alterações." }, { status: 403 });
    }

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
