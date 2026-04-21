import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/transactions - Lista transações (com filtros de mês/ano)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const type = searchParams.get("type");

    const where = {};
    if (type) where.type = type;

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.transactionDate = { gte: startDate, lte: endDate };
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    // Calcula totais
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    return NextResponse.json({
      transactions,
      summary: { income, expense, profit: income - expense },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/transactions - Cria nova transação
export async function POST(request) {
  try {
    const body = await request.json();
    const transaction = await prisma.financialTransaction.create({
      data: {
        projectId: body.projectId || null,
        type: body.type,
        amount: body.amount,
        transactionDate: new Date(body.transactionDate),
        description: body.description || null,
        category: body.category || null,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
