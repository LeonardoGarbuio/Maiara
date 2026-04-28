import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ============================================================
  // ROTAS PÚBLICAS — não exigem autenticação
  // ============================================================
  if (
    pathname === "/" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  // ============================================================
  // AUTENTICAÇÃO — exige JWT válido no cookie
  // ============================================================
  const token = request.cookies.get("tiamai_token")?.value;

  if (!token) {
    // Se for página do dashboard, redireciona pro login
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.json(
      { error: "Acesso Negado: Chave de Segurança Ausente" },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);

  if (!payload) {
    // Token inválido/expirado — redireciona ou rejeita
    if (pathname.startsWith("/dashboard")) {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("tiamai_token");
      return response;
    }
    return NextResponse.json(
      { error: "Acesso Negado: Chave Inválida ou Expirada" },
      { status: 401 }
    );
  }

  // ============================================================
  // AUTORIZAÇÃO — Blindagem de Rotas por Papel (RBAC)
  // ============================================================

  // Rotas ADMIN-ONLY (APIs)
  const adminOnlyApiPaths = [
    "/api/transactions",
    "/api/users",
  ];

  for (const adminPath of adminOnlyApiPaths) {
    if (pathname.startsWith(adminPath)) {
      if (payload.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Acesso Negado: Permissão Insuficiente (Apenas Admin)" },
          { status: 403 }
        );
      }
    }
  }

  // POST/PUT/DELETE em /api/clients só para ADMIN (GET liberado para todos)
  if (pathname.startsWith("/api/clients") && request.method !== "GET") {
    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso Negado: Apenas administradores podem modificar clientes" },
        { status: 403 }
      );
    }
  }

  // Páginas ADMIN-ONLY (Dashboard)
  const adminOnlyPages = [
    "/dashboard/financeiro",
    "/dashboard/equipe",
  ];

  for (const adminPage of adminOnlyPages) {
    if (pathname.startsWith(adminPage)) {
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // ============================================================
  // PASSTHROUGH — injeta dados verificados do JWT nos headers
  // ============================================================
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.id);
  requestHeaders.set("x-user-role", payload.role);
  requestHeaders.set("x-user-username", payload.username || "");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Intercepta TODAS as rotas da API e do Dashboard
export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
