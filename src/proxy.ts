import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { readSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS, SESSION_RENEW_AFTER, signSession } from "./lib/auth/token";

const intl = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Оптимистичная проверка: окончательная проверка сессии — в layout админки и в server actions.
    if (pathname === "/admin/login") return NextResponse.next();
    const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    const response = NextResponse.next();
    // Скользящая сессия: раз в сутки выдаём новую cookie на 60 дней — пароль не спрашивается снова.
    if (Date.now() / 1000 - session.iat > SESSION_RENEW_AFTER) {
      response.cookies.set(SESSION_COOKIE, await signSession(session.pv), SESSION_COOKIE_OPTIONS);
    }
    return response;
  }

  return intl(request);
}

export const config = {
  // Всё, кроме API, служебных файлов Next.js и файлов со статическими расширениями.
  matcher: ["/((?!api|_next|_vercel|uploads|icon|apple-icon|.*\\..*).*)"],
};
