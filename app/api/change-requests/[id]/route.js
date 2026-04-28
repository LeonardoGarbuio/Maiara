import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const paramsResolved = await params;
    const { id } = paramsResolved;
    const { status, documentStatus, checklistItems } = await request.json();

    // Se vier checklistItems, vamos iterar (Estagiário ou Admin podem dar o "Feito" no checklist)
    if (checklistItems && Array.isArray(checklistItems)) {
      for (const item of checklistItems) {
        await prisma.changeRequestChecklist.update({
          where: { id: item.id },
          data: { isCompleted: item.isCompleted }
        });
      }
    }

    // Se vier status do change request principal
    if (status) {
      await prisma.changeRequest.update({
        where: { id },
        data: { status }
      });
    }

    // Opcionalmente também dar o "Feito" realocando o documento
    if (documentStatus) {
      const cr = await prisma.changeRequest.findUnique({ where: { id }});
      if (cr && cr.documentId) {
        await prisma.document.update({
          where: { id: cr.documentId },
          data: { status: documentStatus }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
