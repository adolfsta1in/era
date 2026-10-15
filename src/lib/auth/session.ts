import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, signSession, verifySession } from "./token";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Для страниц и server actions админки: без сессии — на страницу входа. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(), SESSION_COOKIE_OPTIONS);
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
