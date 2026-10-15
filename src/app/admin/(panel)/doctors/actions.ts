"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { bool, file, int, localized, localizedLines, str, type FormState } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { saveImage, UploadError } from "@/lib/storage";
import { addDays, eachDateKey, isDateKey } from "@/lib/time";

function invalidate() {
  updateTag(TAGS.doctors);
  updateTag(TAGS.services);
  updateTag(TAGS.schedule);
  revalidatePath("/admin/doctors", "layout");
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function saveDoctor(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id") || null;
  const name = localized(fd, "name");
  const errors: Record<string, string> = {};
  if (name.ru.length < 2) errors.name = "Укажите имя";
  const slug = str(fd, "slug") || slugify(name.ru);
  if (!SLUG_RE.test(slug)) errors.slug = "Только латиница, цифры и дефисы";
  const year = int(fd, "experienceSince", new Date().getFullYear());
  // 0 — стаж неизвестен, на сайте не показывается.
  if (year !== 0 && (year < 1950 || year > new Date().getFullYear())) errors.experienceSince = "Некорректный год";
  const taken = await db.doctor.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (taken) errors.slug = "Такой адрес уже занят";
  if (Object.keys(errors).length) return { errors, message: "Проверьте поля формы" };

  let photoUrl: string | null | undefined;
  const photo = file(fd, "photo");
  try {
    if (photo) photoUrl = await saveImage(photo, "doctors");
    else if (bool(fd, "removePhoto")) photoUrl = null;
  } catch (e) {
    if (e instanceof UploadError) return { errors: { photo: e.message }, message: e.message };
    throw e;
  }

  const data = {
    slug,
    name,
    specialty: localized(fd, "specialty"),
    bio: localized(fd, "bio"),
    education: localizedLines(fd, "education"),
    experienceSince: year,
    isActive: bool(fd, "isActive"),
    ...(photoUrl !== undefined ? { photoUrl } : {}),
  };

  if (id) {
    await db.doctor.update({ where: { id }, data });
    invalidate();
    return { ok: true, message: "Профиль сохранён" };
  }
  const max = await db.doctor.aggregate({ _max: { sortOrder: true } });
  const created = await db.doctor.create({ data: { ...data, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  invalidate();
  redirect(`/admin/doctors/${created.id}?tab=schedule&created=1`);
}

export async function saveDoctorServices(doctorId: string, serviceIds: string[]): Promise<FormState> {
  await requireAdmin();
  await db.$transaction([
    db.doctorService.deleteMany({ where: { doctorId } }),
    db.doctorService.createMany({ data: serviceIds.map((serviceId) => ({ doctorId, serviceId })) }),
  ]);
  invalidate();
  return { ok: true, message: "Услуги врача сохранены" };
}

const dayRuleSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMin: z.number().int().min(0).max(1440),
    endMin: z.number().int().min(0).max(1440),
    breakStartMin: z.number().int().min(0).max(1440).nullable(),
    breakEndMin: z.number().int().min(0).max(1440).nullable(),
  })
  .refine((r) => r.endMin > r.startMin, "Конец смены должен быть позже начала")
  .refine(
    (r) =>
      (r.breakStartMin === null && r.breakEndMin === null) ||
      (r.breakStartMin !== null && r.breakEndMin !== null && r.breakEndMin > r.breakStartMin && r.breakStartMin >= r.startMin && r.breakEndMin <= r.endMin),
    "Перерыв должен быть внутри смены",
  );

export async function saveSchedule(doctorId: string, rules: unknown): Promise<FormState> {
  await requireAdmin();
  const parsed = z.array(dayRuleSchema).safeParse(rules);
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Проверьте график" };
  await db.$transaction([
    db.scheduleRule.deleteMany({ where: { doctorId } }),
    db.scheduleRule.createMany({ data: parsed.data.map((r) => ({ ...r, doctorId })) }),
  ]);
  invalidate();
  return { ok: true, message: "График сохранён" };
}

const exceptionSchema = z
  .object({
    from: z.string().refine(isDateKey, "Укажите дату"),
    to: z.string().refine(isDateKey).optional().or(z.literal("")),
    type: z.enum(["DAY_OFF", "CUSTOM_HOURS"]),
    startMin: z.number().int().nullable(),
    endMin: z.number().int().nullable(),
    note: z.string().max(200).optional(),
  })
  .refine((e) => e.type === "DAY_OFF" || (e.startMin !== null && e.endMin !== null && e.endMin > e.startMin), "Укажите часы работы");

/** Выходной/отпуск на диапазон дат или особые часы на дату. Существующие исключения на эти даты заменяются. */
export async function addException(doctorId: string, input: unknown): Promise<FormState> {
  await requireAdmin();
  const parsed = exceptionSchema.safeParse(input);
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  const e = parsed.data;
  const to = e.to && e.to >= e.from ? e.to : e.from;
  if (to > addDays(e.from, 366)) return { message: "Слишком длинный период" };
  const dates = eachDateKey(e.from, to);

  await db.$transaction([
    db.scheduleException.deleteMany({ where: { doctorId, date: { in: dates } } }),
    db.scheduleException.createMany({
      data: dates.map((date) => ({
        doctorId,
        date,
        type: e.type,
        startMin: e.type === "CUSTOM_HOURS" ? e.startMin : null,
        endMin: e.type === "CUSTOM_HOURS" ? e.endMin : null,
        note: e.note || null,
      })),
    }),
  ]);
  invalidate();
  return { ok: true, message: dates.length > 1 ? `Добавлено дней: ${dates.length}` : "Исключение добавлено" };
}

export async function deleteException(id: string): Promise<FormState> {
  await requireAdmin();
  await db.scheduleException.delete({ where: { id } });
  invalidate();
  return { ok: true, message: "Исключение удалено" };
}

export async function moveDoctor(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const list = await db.doctor.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true } });
  const i = list.findIndex((d) => d.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((d, idx) => db.doctor.update({ where: { id: d.id }, data: { sortOrder: idx } })));
  invalidate();
}

export async function deleteDoctor(id: string): Promise<FormState> {
  await requireAdmin();
  const count = await db.appointment.count({ where: { doctorId: id } });
  if (count > 0) return { message: "У врача есть записи — скройте его с сайта (выключите «Показывать на сайте»)" };
  await db.doctor.delete({ where: { id } });
  invalidate();
  redirect("/admin/doctors");
}
