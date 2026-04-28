import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

async function isDocProjectFinished(docId) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    select: { projectId: true }
  });
  if (!doc?.projectId) return false;
  const project = await prisma.project.findUnique({
    where: { id: doc.projectId },
    select: { status: true }
  });
  return project?.status === "FINISHED";
}

async function isDocPhaseFinished(docId) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    select: { phaseId: true }
  });
  if (!doc?.phaseId) return false;
  const phase = await prisma.phase.findUnique({
    where: { id: doc.phaseId },
    select: { status: true }
  });
  return phase?.status === "COMPLETED";
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const user = auth.user;

    const paramsResolved = await params;
    const { id } = paramsResolved;

    if (user.role !== "ADMIN") {
      if (await isDocProjectFinished(id)) {
        return NextResponse.json({ error: "Projeto concluído. Alterações bloqueadas." }, { status: 403 });
      }
      
      if (await isDocPhaseFinished(id)) {
        return NextResponse.json({ error: "Etapa da qual este arquivo faz parte já foi concluída. Arquivo bloqueado para edição." }, { status: 403 });
      }
    }

    const body = await request.json();
    const updateData = {};
    if (body.name) updateData.name = body.name;
    if (body.status) updateData.status = body.status;
    if (body.folderId !== undefined) updateData.folderId = body.folderId;

    const document = await prisma.document.update({
      where: { id },
      data: updateData
    });

    await prisma.driveActivityLog.create({
      data: {
        projectId: document.projectId,
        userId: user.id,
        action: "EDIT_DOCUMENT",
        targetName: document.name
      }
    });

    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const user = auth.user;

    const paramsResolved = await params;
    const { id } = paramsResolved;

    if (user.role !== "ADMIN") {
      if (await isDocProjectFinished(id)) {
        return NextResponse.json({ error: "Projeto concluído. Exclusão bloqueada." }, { status: 403 });
      }
  
      if (await isDocPhaseFinished(id)) {
        return NextResponse.json({ error: "Etapa da qual este arquivo faz parte já foi concluída. Exclusão bloqueada." }, { status: 403 });
      }
    }

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });

    await prisma.documentVersion.deleteMany({ where: { documentId: id } });
    await prisma.document.delete({ where: { id } });

    await prisma.driveActivityLog.create({
      data: {
        projectId: doc.projectId,
        userId: user.id,
        action: "DELETE_DOCUMENT",
        targetName: doc.name
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
