import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/health - Heartbeat para manter o Supabase vivo
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
