import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/ensure-admin";

export const dynamic = "force-dynamic";

// POST /api/auth/login - Login real com banco
export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuário e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------------
    // PROTEÇÃO ANTI-FORÇA BRUTA (Brute Force Rate Limiting)
    // ----------------------------------------------------------------------
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const limitKey = `${clientIp}_${username}`;
    const now = Date.now();
    const limitWindow = 10 * 60 * 1000; // 10 minutos
    
    // Inicializa a variável global se não existir no ambiente serveless
    if (!global.rateLimitMap) {
      global.rateLimitMap = new Map();
    }
    
    const attempts = global.rateLimitMap.get(limitKey) || { count: 0, firstAttempt: now };
    
    if (now - attempts.firstAttempt > limitWindow) {
      // Limpa após 10 minutos
      attempts.count = 0;
      attempts.firstAttempt = now;
    }

    if (attempts.count >= 10) {
      return NextResponse.json(
        { error: "Muitas tentativas falhas. Conta temporariamente bloqueada por segurança. Tente novamente em 10 minutos." },
        { status: 429 } // Too Many Requests
      );
    }
    // ----------------------------------------------------------------------

    // Garante que a admin Maiara exista no banco
    await ensureAdmin();

    const cleanUsername = username.trim();

    // Busca o usuário no banco (case insensitive)
    const user = await prisma.user.findFirst({ 
      where: { 
        username: {
          equals: cleanUsername,
          mode: "insensitive"
        }
      } 
    });

    if (!user) {
      attempts.count += 1;
      global.rateLimitMap.set(limitKey, attempts);
      return NextResponse.json(
        { error: "Usuário ou senha incorretos" },
        { status: 401 }
      );
    }

    // Compara a senha
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      attempts.count += 1;
      global.rateLimitMap.set(limitKey, attempts);
      return NextResponse.json(
        { error: "Usuário ou senha incorretos" },
        { status: 401 }
      );
    }

    // Sucesso Absoluto: Resetar tentativas contra força bruta!
    global.rateLimitMap.delete(limitKey);

    // Atualiza o last_login (segurança)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Gerar JWT Seguro
    const { signToken } = await import("@/lib/auth");
    const token = await signToken({
      id: user.id,
      role: user.role,
      username: user.username,
    });

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });

    // Injetar cookie blindado na resposta (HTTP-Only = não pode ser lido por XSS)
    // Secure = só roda sobre HTTPS em produção
    response.cookies.set({
      name: "tiamai_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
