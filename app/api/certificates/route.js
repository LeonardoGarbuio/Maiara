import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/certificates - Lista todos os atestados
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(certificates);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/certificates - Estagiário envia atestado
export async function POST(request) {
  try {
    const body = await request.json();
    const certificate = await prisma.certificate.create({
      data: {
        userId: body.userId,
        absenceDate: new Date(body.absenceDate),
        fileUrl: body.fileUrl,
        description: body.description || null,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
