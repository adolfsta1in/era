"use server";

import { redirect } from "next/navigation";
import { checkPassword } from "@/lib/auth/credentials";
import { endSession, startSession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: "invalid" | "rate" | "config" };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  // ADMIN_PASSWORD нужен только пока пароль не сменили в «Настройках» (тогда он хранится в базе).
  if (!process.env.SESSION_SECRET) return { error: "config" };
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}`, 10, 15 * 60_000))) return { error: "rate" };
  if (!(await checkPassword(String(formData.get("password") ?? "")))) return { error: "invalid" };

  await startSession();
  const next = String(formData.get("next") ?? "");
  // Разрешаем возврат только на страницы админки (защита от open redirect).
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}
