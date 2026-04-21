import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Destruir cookie blindado do JWT para encerrar a sessão no servidor
  response.cookies.set({
    name: "tiamai_token",
    value: "",
    httpOnly: true,
    expires: new Date(0), // Data passada expira imediatamente
    path: "/",
  });

  return response;
}
