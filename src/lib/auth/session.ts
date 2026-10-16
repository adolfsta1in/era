import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentPasswordVersion } from "./credentials";
import { readSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS, signSession } from "./token";

/** Подпись cookie верна и выдана под действующий пароль (после смены пароля старые сессии не проходят). */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const session = await readSession(store.get(SESSION_COOKIE)?.value);
  return session !== null && session.pv === (await currentPasswordVersion());
}

/** Для страниц и server actions админки: без сессии — на страницу входа. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function startSession(pv?: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(pv ?? (await currentPasswordVersion())), SESSION_COOKIE_OPTIONS);
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
