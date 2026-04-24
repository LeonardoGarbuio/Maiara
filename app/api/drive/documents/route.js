import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getSupabaseAdmin, ensureBucketExists } from "@/lib/supabase";

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
    const root = searchParams.get("root");

    if (!projectId) {
      return NextResponse.json({ error: "projectId é obrigatório" }, { status: 400 });
    }

    const whereClause = { projectId };
    if (root === "true") {
      whereClause.folderId = null;
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
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
    });

    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const authCheck = await prisma.user.findUnique({ where: { id: user.id } });
    if (!authCheck) return NextResponse.json({ error: "Usuário inválido" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = formData.get("projectId");
    const folderId = formData.get("folderId"); // Opcional
    const selectedDocumentId = formData.get("documentId"); // Se tiver, é uma nova versão
    const notes = formData.get("notes") || "";


    if (!file || !projectId) {
      return NextResponse.json({ error: "Arquivo e projectId são obrigatórios" }, { status: 400 });
    }

    // Check se projeto foi concluído (read-only)
    if (user.role !== "ADMIN") {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { status: true } });
      if (project?.status === "FINISHED") {
        return NextResponse.json({ error: "Projeto concluído. O upload de novos arquivos ou versões está bloqueado." }, { status: 403 });
      }
    }

    // Herdar a ETAPA da pasta pai (se existir)
    let phaseId = null;
    if (folderId) {
      const folderInfo = await prisma.folder.findUnique({ where: { id: folderId }, select: { phaseId: true } });
      if (folderInfo && folderInfo.phaseId) {
        phaseId = folderInfo.phaseId;
      }
    }

    // Check se a ETAPA foi concluída (trava direcional do cliente)
    if (phaseId && user.role !== "ADMIN") {
      const phase = await prisma.phase.findUnique({ where: { id: phaseId }, select: { status: true } });
      if (phase?.status === "COMPLETED") {
        return NextResponse.json({ error: "A pasta desta etapa já foi concluída/trancada. Não é possível enviar novos arquivos para ela." }, { status: 403 });
      }
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });
    
    await ensureBucketExists("project-files");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `drive/${projectId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    let documentId = selectedDocumentId;
    let newVersionNumber = 1;

    // Se é um arquivo base novo (primeira upload)
    if (!documentId) {
      const doc = await prisma.document.create({
        data: {
          projectId,
          folderId: folderId || null,
          phaseId: phaseId || null,
          name: file.name,
          fileUrl,
          extension: fileExtension,
          status: "PENDING",
        }
      });
      documentId = doc.id;
    } else {
      // Obter o ultimo version number
      const lastVer = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { versionNumber: 'desc' }
      });
      newVersionNumber = lastVer ? lastVer.versionNumber + 1 : 1;

      // Atualizar no documento raiz
      await prisma.document.update({
        where: { id: documentId },
        data: { fileUrl, extension: fileExtension } 
      });
    }

    // Gerar registro na base imutável de Log Audit Trail
    const versionLog = await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: newVersionNumber,
        fileUrl,
        extension: fileExtension,
        uploadedBy: user.id,
        uploadNotes: notes,
      }
    });

    await prisma.driveActivityLog.create({
      data: {
        projectId,
        userId: user.id,
        action: newVersionNumber === 1 ? "UPLOADED_DOCUMENT" : "UPDATED_DOCUMENT",
        targetName: file.name
      }
    });

    return NextResponse.json({ success: true, documentId, versionLog }, { status: 201 });
  } catch (error) {
    console.error("Erro no upload do drive:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
