import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "admin_session";
/**
 * Вход живёт 60 дней и продлевается при каждом заходе в админку (не чаще раза в сутки, см. src/proxy.ts):
 * кто пользуется админкой хотя бы раз в два месяца — с телефона, из браузера или из программы на ПК —
 * пароль больше не вводит. «Выйти» в админке сбрасывает вход на этом устройстве.
 */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 60; // 60 дней
/** Через сколько после выдачи сессию продлеваем новой cookie. */
export const SESSION_RENEW_AFTER = 60 * 60 * 24; // сутки

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET должен быть задан и содержать минимум 32 символа");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getKey());
}

/** Данные действующей сессии (iat — время выдачи, сек) или null. */
export async function readSession(token: string | undefined): Promise<{ iat: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    return payload.role === "admin" ? { iat: payload.iat ?? 0 } : null;
  } catch {
    return null;
  }
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  return (await readSession(token)) !== null;
}

/** Параметры cookie сессии — одни и те же при входе и при продлении. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE,
} as const;
