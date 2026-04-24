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

// Helper: check if folder's project is finished
async function isFolderProjectFinished(folderId) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { projectId: true }
  });
  if (!folder?.projectId) return false;
  const project = await prisma.project.findUnique({
    where: { id: folder.projectId },
    select: { status: true }
  });
  return project?.status === "FINISHED";
}

export async function GET(request, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const paramsResolved = await params;
    const { id } = paramsResolved;

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { name: 'asc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1
            },
            phase: {
              select: { name: true, status: true }
            }
          }
        }
      }
    });

    if (!folder) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });

    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const paramsResolved = await params;
    const { id } = paramsResolved;

    if (user.role !== "ADMIN") {
      if (await isFolderProjectFinished(id)) {
        return NextResponse.json({ error: "Projeto concluído. Alterações bloqueadas." }, { status: 403 });
      }
    }

    const currentFolder = await prisma.folder.findUnique({
      where: { id },
      include: { phase: true }
    });
    if (!currentFolder) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });

    const body = await request.json();

    if (currentFolder.phase && user.role !== "ADMIN") {
      if (currentFolder.phase.status === "COMPLETED") {
        return NextResponse.json({ error: "A etapa correspondente a esta pasta já foi concluída. A pasta está trancada." }, { status: 403 });
      }
      if (body.parentId !== undefined && body.parentId !== currentFolder.parentId) {
        return NextResponse.json({ error: "Você não pode mover pastas de etapa geradas pelo sistema." }, { status: 403 });
      }
    }

    const updateData = {};
    if (body.name) updateData.name = body.name;
    if (body.parentId !== undefined && !currentFolder.phaseId) updateData.parentId = body.parentId;

    const folder = await prisma.folder.update({
      where: { id },
      data: updateData
    });

    await prisma.driveActivityLog.create({
      data: {
        projectId: folder.projectId,
        userId: user.id,
        action: "EDIT_FOLDER",
        targetName: folder.name
      }
    });

    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const paramsResolved = await params;
    const { id } = paramsResolved;

    if (user.role !== "ADMIN") {
      if (await isFolderProjectFinished(id)) {
        return NextResponse.json({ error: "Projeto concluído. Exclusão bloqueada." }, { status: 403 });
      }
    }

    const currentFolder = await prisma.folder.findUnique({
      where: { id }
    });
    if (!currentFolder) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });

    if (currentFolder.phaseId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Pastas de etapa geradas pelo sistema não podem ser excluídas." }, { status: 403 });
    }

    await prisma.folder.delete({
      where: { id }
    });

    await prisma.driveActivityLog.create({
      data: {
        projectId: currentFolder.projectId,
        userId: user.id,
        action: "DELETE_FOLDER",
        targetName: currentFolder.name
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
