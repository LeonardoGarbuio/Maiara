import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin, ensureBucketExists } from "@/lib/supabase";

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const user = auth.user;

    const authCheck = await prisma.user.findUnique({ where: { id: user.id } });
    if (!authCheck) return NextResponse.json({ error: "Usuário inválido" }, { status: 401 });

    const body = await request.json();
    const { projectId, folderId, fileName, fileType } = body;

    if (!fileName || !projectId) {
      return NextResponse.json({ error: "fileName e projectId são obrigatórios" }, { status: 400 });
    }

    // Check se projeto foi concluído (read-only)
    if (user.role !== "ADMIN") {
      const project = await prisma.project.findUnique({ where: { id: projectId }, select: { status: true } });
      if (project?.status === "FINISHED") {
        return NextResponse.json({ error: "Projeto concluído. O upload está bloqueado." }, { status: 403 });
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
        return NextResponse.json({ error: "A pasta desta etapa já foi concluída/trancada." }, { status: 403 });
      }
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });
    
    await ensureBucketExists("project-files");

    const fileExtension = fileName.split('.').pop();
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `drive/${projectId}/${uniqueName}`;

    // Gerar URL assinada para upload direto pelo cliente
    const { data, error } = await supabase.storage
      .from("project-files")
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Supabase presign error:", error);
      throw error;
    }

    // Retorna a signedUrl e o filePath que foi gerado
    return NextResponse.json({ 
      signedUrl: data.signedUrl, 
      filePath: filePath,
      token: data.token, // para ser usado pelo supabase-js (ou não, se usar fetch puro)
      phaseId: phaseId
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao gerar signed url:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
