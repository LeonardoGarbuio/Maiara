import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const user = auth.user;

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const projectId = searchParams.get("projectId");

    if (parentId) {
      const folders = await prisma.folder.findMany({
        where: { parentId },
        orderBy: { name: 'asc' },
        include: {
          phase: { select: { status: true } }
        }
      });
      return NextResponse.json(folders);
    } else {
      // get root folders (filtered by projectId if exists)
      const whereClause = { parentId: null };
      if (projectId) {
        whereClause.projectId = projectId;

        // AUTO-GERAÇÃO de PASTAS DE ETAPAS
        const projectPhases = await prisma.phase.findMany({
          where: { projectId },
          select: { id: true, name: true }
        });
        
        for (const ph of projectPhases) {
          const exists = await prisma.folder.findFirst({
            where: { projectId, phaseId: ph.id }
          });
          if (!exists) {
            try {
              await prisma.folder.create({
                data: {
                  name: ph.name,
                  projectId: projectId,
                  phaseId: ph.id,
                  parentId: null
                }
              });
            } catch (e) {
              // Absorve silenciosamente erro de Duplicação Concorrente no Prisma
              if (e.code !== 'P2002') throw e;
            }
          }
        }
      }
      
      const folders = await prisma.folder.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: {
          phase: { select: { status: true } }
        }
      });
      return NextResponse.json(folders);
    }

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
    if (!body.name) {
       return NextResponse.json({ error: "O nome da pasta é obrigatório" }, { status: 400 });
    }

    // Check if project is finished (read-only mode)
    if (body.projectId && user.role !== "ADMIN") {
      const project = await prisma.project.findUnique({ where: { id: body.projectId }, select: { status: true } });
      if (project?.status === "FINISHED") {
        return NextResponse.json({ error: "Projeto concluído. Não é possível criar novas pastas." }, { status: 403 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: body.name,
        parentId: body.parentId || null,
        projectId: body.projectId || null,
      }
    });

    if (body.projectId) {
      await prisma.driveActivityLog.create({
        data: {
          projectId: body.projectId,
          userId: user.id,
          action: "CREATE_FOLDER",
          targetName: folder.name
        }
      });
    }

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
