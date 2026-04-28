import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

// DELETE /api/transactions/[id]
export async function DELETE(request, { params }) {
  try {
    // 🔒 ADMIN ONLY
    const auth = await requireAuth(request, "ADMIN");
    if (auth.error) return auth.error;

    const { id } = await params;
    await prisma.financialTransaction.delete({ where: { id } });
    return NextResponse.json({ message: "Transação deletada" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/transactions/[id]
export async function PUT(request, { params }) {
  try {
    // 🔒 ADMIN ONLY
    const auth = await requireAuth(request, "ADMIN");
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: {
        type: body.type,
        amount: body.amount,
        transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
        description: body.description,
        category: body.category,
        projectId: body.projectId,
      },
    });
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
