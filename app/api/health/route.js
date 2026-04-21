import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/health - Heartbeat para manter o Supabase vivo
// Essa rota é chamada automaticamente pelo Vercel Cron a cada 5 dias
// para impedir que o banco entre em modo de hibernação.
export async function GET() {
  try {
    // Consulta mínima: apenas conta 1 registro para "acordar" o banco
    const count = await prisma.user.count();

    return NextResponse.json({
      status: "alive",
      timestamp: new Date().toISOString(),
      dbUsers: count,
      message: "Supabase heartbeat OK — banco ativo e respondendo.",
    });
  } catch (error) {
    console.error("HEARTBEAT FALHOU:", error.message);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}
