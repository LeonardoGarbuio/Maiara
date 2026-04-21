import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT /api/certificates/[id] - Admin aprova/rejeita atestado
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const certificate = await prisma.certificate.update({
      where: { id },
      data: { status: body.status },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(certificate);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/certificates/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.certificate.delete({ where: { id } });
    return NextResponse.json({ message: "Atestado deletado" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
