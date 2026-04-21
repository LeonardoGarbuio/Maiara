import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Rotas públicas que NÃO exigem autenticação
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/health") // Heartbeat do Supabase (chamado pelo Vercel Cron)
  ) {
    return NextResponse.next();
  }

  // Pegar o Token invisível
  const token = request.cookies.get("tiamai_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Acesso Negado: Chave de Segurança Ausente" }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Acesso Negado: Chave Inválida ou Expirada" }, { status: 401 });
  }

  // ----------------------------------------------------
  // BLINDAGEM DE ROTAS (Segurança baseada em Papéis)
  // ----------------------------------------------------

  // Rotas exclusivas de Admin
  if (
    pathname.startsWith("/api/transactions") ||
    pathname.startsWith("/api/users")
  ) {
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso Negado: Permissão Insuficiente (Apenas Admin)" }, { status: 403 });
    }
  }

  // Injetar dados verificados da chave para as APIs poderem usar garantidamente!
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.id);
  requestHeaders.set("x-user-role", payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configurar o porteiro (proxy) para interceptar apenas rotas da API
export const config = {
  matcher: "/api/:path*",
};
