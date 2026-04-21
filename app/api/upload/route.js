import { NextResponse } from "next/server";
import { getSupabaseAdmin, ensureBucketExists } from "@/lib/supabase";

export async function POST(request) {
  try {
    await ensureBucketExists("project-files");

    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = formData.get("projectId");

    if (!file || !projectId) {
      return NextResponse.json({ error: "Arquivo ou ID do projeto não informados" }, { status: 400 });
    }

    // Criar um nome de arquivo único para não sobrepor
    const fileExt = file.name.split(".").pop().toLowerCase();
    
    // Antivírus Baseado em Extensão (Prevenção de Malware/Ransomware)
    const allowedExtensions = ['pdf', 'dwg', 'skp', 'rvt', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx', 'zip'];
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ error: `Formato de arquivo não permitido pela Segurança Nacional (bloqueado: .${fileExt}). Apenas arquivos de projeto ou imagens.` }, { status: 415 });
    }

    const fileName = `${projectId}/${crypto.randomUUID()}.${fileExt}`;

    // Converter para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para o Supabase
    const { data, error } = await getSupabaseAdmin().storage
      .from("project-files")
      .upload(fileName, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Obter URL pública
    const { data: publicUrlData } = getSupabaseAdmin().storage
      .from("project-files")
      .getPublicUrl(fileName);

    // Salvar no Prisma
    const docType = formData.get("docType") || "PLAN";
    const document = await import("@/lib/prisma").then(m => m.default).then(prisma => prisma.document.create({
      data: {
        projectId,
        name: file.name,
        fileUrl: publicUrlData.publicUrl,
        type: docType,
      }
    }));

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name,
      documentId: document.id
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
