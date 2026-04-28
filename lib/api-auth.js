import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Helper centralizado de autenticação/autorização para API Routes.
 * 
 * Uso:
 *   const auth = await requireAuth(request);            // qualquer usuário logado
 *   const auth = await requireAuth(request, "ADMIN");   // apenas admin
 * 
 * Retorna:
 *   { user: { id, role, username } } em caso de sucesso
 *   { error: NextResponse } em caso de falha (retorne direto na route)
 */
export async function requireAuth(request, requiredRole = null) {
  // Camada 1: Tenta ler do header injetado pelo proxy (mais rápido, já verificado)
  const headerUserId = request.headers.get("x-user-id");
  const headerUserRole = request.headers.get("x-user-role");
  const headerUsername = request.headers.get("x-user-username");

  const checkRole = (r) => Array.isArray(requiredRole) ? requiredRole.includes(r) : r === requiredRole;

  if (headerUserId && headerUserRole) {
    const user = { id: headerUserId, role: headerUserRole, username: headerUsername || "" };

    if (requiredRole && !checkRole(user.role)) {
      return {
        error: NextResponse.json(
          { error: "Acesso Negado: Permissão insuficiente" },
          { status: 403 }
        ),
      };
    }

    return { user };
  }

  // Camada 2: Fallback — valida diretamente do cookie (caso o proxy não esteja ativo)
  const cookieStore = await cookies();
  const token = cookieStore.get("tiamai_token")?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      ),
    };
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      ),
    };
  }

  if (requiredRole && !checkRole(payload.role)) {
    return {
      error: NextResponse.json(
        { error: "Acesso Negado: Permissão insuficiente" },
        { status: 403 }
      ),
    };
  }

  return { user: { id: payload.id, role: payload.role, username: payload.username } };
}
