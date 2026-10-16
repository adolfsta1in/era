"use server";

import type { FormState } from "@/lib/admin/form";
import { checkPassword, setPassword } from "@/lib/auth/credentials";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-rules";
import { requireAdmin, startSession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Смена пароля админки. Текущее устройство остаётся в админке (новая сессия), на остальных
 * устройствах нужно войти заново с новым паролем.
 */
export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const ip = await clientIp();
  if (!(await rateLimit(`password:${ip}`, 5, 15 * 60_000))) {
    return { message: "Слишком много попыток. Подождите 15 минут." };
  }

  // Пароли не обрезаем: пробелы по краям — часть пароля, как и при входе.
  const current = String(fd.get("currentPassword") ?? "");
  const next = String(fd.get("newPassword") ?? "");
  const repeat = String(fd.get("repeatPassword") ?? "");
  const errors: Record<string, string> = {};

  if (!(await checkPassword(current))) errors.currentPassword = "Неверный текущий пароль";
  if (next.length < MIN_PASSWORD_LENGTH) errors.newPassword = `Минимум ${MIN_PASSWORD_LENGTH} символов`;
  else if (next === current) errors.newPassword = "Новый пароль совпадает с текущим";
  if (repeat !== next) errors.repeatPassword = "Пароли не совпадают";
  if (Object.keys(errors).length) return { errors, message: Object.values(errors)[0] };

  const pv = await setPassword(next);
  await startSession(pv);
  return { ok: true, message: "Пароль изменён. На других устройствах нужно войти с новым паролем." };
}
