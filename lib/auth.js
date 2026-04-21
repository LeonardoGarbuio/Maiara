import { SignJWT, jwtVerify } from "jose";

// Em produção, isso DEVE vir do .env
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || "tia_mai_super_secret_fallback_key_2026_xpto!@#";
  return new TextEncoder().encode(secret);
};

export async function signToken(payload) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // Expira em 24h
      .sign(getJwtSecretKey());
    return token;
  } catch (error) {
    console.error("Erro ao assinar JWT:", error);
    throw new Error("Erro interno na geração de token.");
  }
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch (error) {
    // Retorna nulo se for inválido, expirado, ou mexido
    return null;
  }
}
