"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { WorkingHours } from "@/config/clinic";
import { isThemeId } from "@/config/themes";
import { bool, file, int, localized, num, str, type FormState } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { saveImage, UploadError } from "@/lib/storage";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const schema = z.object({
  name: z.string().min(2, "Укажите название"),
  shortName: z.string().min(2, "Укажите короткое название"),
  email: z.union([z.literal(""), z.email("Некорректный e-mail")]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  twoGisUrl: z.union([z.literal(""), z.url("Некорректная ссылка")]),
  mapEmbedUrl: z.union([z.literal(""), z.url("Некорректная ссылка").refine((u) => u.startsWith("https://"), "Ссылка должна начинаться с https://")]),
  // 0 — год неизвестен, блок «лет работаем» на сайте скрыт.
  foundedYear: z.union([z.literal(0), z.number().int().min(1950).max(2100)]),
  patientsCount: z.number().int().min(0),
  rating: z.number().min(0).max(5),
  bookingLeadMinutes: z.number().int().min(0).max(7 * 24 * 60),
  bookingHorizonDays: z.number().int().min(1).max(180),
  slotStepMinutes: z.number().int().refine((v) => [5, 10, 15, 20, 30, 60].includes(v), "Шаг: 5, 10, 15, 20, 30 или 60 минут"),
});

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const base = {
    name: str(fd, "name"),
    shortName: str(fd, "shortName") || str(fd, "name"),
    email: str(fd, "email"),
    lat: num(fd, "lat"),
    lng: num(fd, "lng"),
    twoGisUrl: str(fd, "twoGisUrl"),
    mapEmbedUrl: str(fd, "mapEmbedUrl"),
    foundedYear: int(fd, "foundedYear"),
    patientsCount: int(fd, "patientsCount"),
    rating: num(fd, "rating"),
    bookingLeadMinutes: int(fd, "bookingLeadMinutes"),
    bookingHorizonDays: int(fd, "bookingHorizonDays"),
    slotStepMinutes: int(fd, "slotStepMinutes"),
  };
  const parsed = schema.safeParse(base);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;

  const workingHours = {} as WorkingHours;
  for (const d of ["0", "1", "2", "3", "4", "5", "6"] as const) {
    const open = str(fd, `hours.${d}.open`);
    const close = str(fd, `hours.${d}.close`);
    if (!bool(fd, `hours.${d}.on`)) workingHours[d] = null;
    else if (TIME.test(open) && TIME.test(close) && close > open) workingHours[d] = { open, close };
    else errors[`hours`] = "Проверьте часы работы: закрытие позже открытия";
  }

  const theme = str(fd, "theme");
  if (!isThemeId(theme)) errors.theme = "Выберите тему";
  if (Object.keys(errors).length) return { errors, message: "Проверьте поля формы" };

  let logoUrl: string | null | undefined;
  try {
    const logo = file(fd, "logo");
    if (logo) logoUrl = await saveImage(logo, "logo");
    else if (bool(fd, "removeLogo")) logoUrl = null;
  } catch (e) {
    if (e instanceof UploadError) return { errors: { logo: e.message }, message: e.message };
    throw e;
  }

  const phones = str(fd, "phones")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const data = {
    ...parsed.data!,
    tagline: localized(fd, "tagline"),
    description: localized(fd, "description"),
    about: localized(fd, "about"),
    address: localized(fd, "address"),
    addressNote: localized(fd, "addressNote"),
    phones,
    whatsapp: str(fd, "whatsapp").replace(/\D/g, ""),
    telegram: str(fd, "telegram").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""),
    instagram: str(fd, "instagram").replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, ""),
    workingHours,
    theme,
    legalName: str(fd, "legalName"),
    legalInn: str(fd, "legalInn"),
    ...(logoUrl !== undefined ? { logoUrl } : {}),
  };

  await db.clinicSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data, logoUrl: logoUrl ?? null } });

  updateTag(TAGS.settings);
  updateTag(TAGS.schedule);
  revalidatePath("/", "layout");
  return { ok: true, message: "Настройки сохранены — сайт уже обновлён" };
}

export async function sendTelegramTest(): Promise<FormState> {
  await requireAdmin();
  if (!telegramEnabled()) return { message: "Telegram не настроен: нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID" };
  await sendTelegram(["✅ Тестовое сообщение: уведомления о записях настроены."]);
  return { ok: true, message: "Сообщение отправлено — проверьте чат" };
}
