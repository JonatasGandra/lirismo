import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Mantém os cookies de sessão que o Supabase acabou de renovar.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (pathname.startsWith("/painel") && !user) return redirectTo("/entrar");
  if (pathname === "/entrar" && user) return redirectTo("/painel");

  return response;
}

// Só as rotas que usam login passam pelo middleware. As páginas públicas
// ficam estáticas (ISR) e não pagam a ida ao Supabase Auth a cada visita.
export const config = {
  matcher: ["/painel/:path*", "/entrar"],
};
