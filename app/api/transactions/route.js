import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cacheGetOrFetch, cacheInvalidatePrefix } from "@/lib/cache";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// GET /api/transactions - Lista transações (com filtros de mês/ano)
export async function GET(request) {
  try {
    // 🔒 ADMIN e LEAD_ARCHITECT
    const auth = await requireAuth(request, ["ADMIN", "LEAD_ARCHITECT"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const type = searchParams.get("type");

    const cacheKey = `transactions:list:${month || "all"}:${year || "all"}:${type || "all"}`;

    const transactions = await cacheGetOrFetch(cacheKey, async () => {
      const where = {};
      if (type) where.type = type;

      if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        where.transactionDate = { gte: startDate, lte: endDate };
      }

      return await prisma.financialTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        include: {
          project: { select: { id: true, name: true } },
        },
      });
    }, 60_000); // 60s TTL

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
    // 🔒 ADMIN e LEAD_ARCHITECT
    const auth = await requireAuth(request, ["ADMIN", "LEAD_ARCHITECT"]);
    if (auth.error) return auth.error;

    const body = await request.json();

    if (auth.user.role === "LEAD_ARCHITECT" && body.category === "Prejuízo/Custo Extra") {
      return NextResponse.json({ error: "Acesso Negado: Arquiteta Líder não tem permissão para lançar Prejuízos." }, { status: 403 });
    }
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
    
    cacheInvalidatePrefix("transactions");
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
