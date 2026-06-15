import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const user = auth.user;

    const authCheck = await prisma.user.findUnique({ where: { id: user.id } });
    if (!authCheck) return NextResponse.json({ error: "Usuário inválido" }, { status: 401 });

    const body = await request.json();
    const { projectId, folderId, documentId, notes, filePath, fileName, fileExtension, phaseId } = body;

    if (!projectId || !filePath || !fileName) {
      return NextResponse.json({ error: "Campos obrigatórios faltando na confirmação" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    // Pega a URL pública
    const { data: publicUrlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    let finalDocumentId = documentId;
    let newVersionNumber = 1;

    // Se é um arquivo base novo (primeira upload)
    if (!finalDocumentId) {
      const doc = await prisma.document.create({
        data: {
          projectId,
          folderId: folderId || null,
          phaseId: phaseId || null,
          name: fileName,
          fileUrl,
          extension: fileExtension,
          status: "PENDING",
        }
      });
      finalDocumentId = doc.id;
    } else {
      // Obter o ultimo version number
      const lastVer = await prisma.documentVersion.findFirst({
        where: { documentId: finalDocumentId },
        orderBy: { versionNumber: 'desc' }
      });
      newVersionNumber = lastVer ? lastVer.versionNumber + 1 : 1;

      // Atualizar no documento raiz
      await prisma.document.update({
        where: { id: finalDocumentId },
        data: { fileUrl, extension: fileExtension } 
      });
    }

    // Gerar registro na base imutável de Log Audit Trail
    const versionLog = await prisma.documentVersion.create({
      data: {
        documentId: finalDocumentId,
        versionNumber: newVersionNumber,
        fileUrl,
        extension: fileExtension,
        uploadedBy: user.id,
        uploadNotes: notes || "",
      }
    });

    await prisma.driveActivityLog.create({
      data: {
        projectId,
        userId: user.id,
        action: newVersionNumber === 1 ? "UPLOADED_DOCUMENT" : "UPDATED_DOCUMENT",
        targetName: fileName
      }
    });

    return NextResponse.json({ success: true, documentId: finalDocumentId, versionLog }, { status: 201 });
  } catch (error) {
    console.error("Erro na confirmação do upload:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
