"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { bool, int, localized, str, type FormState } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function invalidate() {
  updateTag(TAGS.services);
  updateTag(TAGS.doctors);
  updateTag(TAGS.schedule);
  revalidatePath("/admin/services", "layout");
}

export async function saveService(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id") || null;
  const name = localized(fd, "name");
  const slug = str(fd, "slug") || slugify(name.ru);
  const durationMin = int(fd, "durationMin");
  const priceFrom = int(fd, "priceFrom");
  const priceTo = str(fd, "priceTo") ? int(fd, "priceTo") : null;
  const currency = str(fd, "currency") === "USD" ? "USD" : "KGS";
  const categoryId = str(fd, "categoryId");
  const doctorIds = fd.getAll("doctorIds").map(String);

  const errors: Record<string, string> = {};
  if (name.ru.length < 2) errors.name = "Укажите название";
  if (!SLUG_RE.test(slug)) errors.slug = "Только латиница, цифры и дефисы";
  if (durationMin < 5 || durationMin > 480 || durationMin % 5 !== 0) errors.durationMin = "От 5 до 480 минут, кратно 5";
  if (priceFrom < 0) errors.priceFrom = "Цена не может быть отрицательной";
  if (priceTo !== null && priceTo < priceFrom) errors.priceTo = "Не меньше цены «от»";
  if (!categoryId) errors.categoryId = "Выберите категорию";
  if (await db.service.findFirst({ where: { slug, NOT: id ? { id } : undefined } })) errors.slug = "Такой адрес уже занят";
  if (Object.keys(errors).length) return { errors, message: "Проверьте поля формы" };

  const data = {
    slug,
    name,
    shortDescription: localized(fd, "shortDescription"),
    description: localized(fd, "description"),
    durationMin,
    priceFrom,
    priceTo,
    currency,
    categoryId,
    isPopular: bool(fd, "isPopular"),
    isActive: bool(fd, "isActive"),
  };

  const saved = id
    ? await db.service.update({ where: { id }, data })
    : await db.service.create({
        data: { ...data, sortOrder: ((await db.service.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0) + 1 },
      });

  await db.$transaction([
    db.doctorService.deleteMany({ where: { serviceId: saved.id } }),
    db.doctorService.createMany({ data: doctorIds.map((doctorId) => ({ doctorId, serviceId: saved.id })) }),
  ]);
  invalidate();
  if (!id) redirect(`/admin/services/${saved.id}?created=1`);
  return { ok: true, message: "Услуга сохранена" };
}

export async function moveService(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const service = await db.service.findUnique({ where: { id } });
  if (!service) return;
  const list = await db.service.findMany({ where: { categoryId: service.categoryId }, orderBy: { sortOrder: "asc" }, select: { id: true } });
  const i = list.findIndex((s) => s.id === id);
  const j = i + direction;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((s, idx) => db.service.update({ where: { id: s.id }, data: { sortOrder: idx } })));
  invalidate();
}

export async function deleteService(id: string): Promise<FormState> {
  await requireAdmin();
  if ((await db.appointment.count({ where: { serviceId: id } })) > 0) {
    return { message: "По услуге есть записи — скройте её (выключите «Показывать на сайте»)" };
  }
  await db.service.delete({ where: { id } });
  invalidate();
  redirect("/admin/services");
}

export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id") || null;
  const name = localized(fd, "name");
  if (name.ru.length < 2) return { message: "Укажите название категории" };
  if (id) {
    await db.serviceCategory.update({ where: { id }, data: { name } });
  } else {
    let slug = slugify(name.ru) || "category";
    if (await db.serviceCategory.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
    const max = await db.serviceCategory.aggregate({ _max: { sortOrder: true } });
    await db.serviceCategory.create({ data: { name, slug, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  }
  invalidate();
  return { ok: true, message: id ? "Категория переименована" : "Категория добавлена" };
}

export async function moveCategory(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const list = await db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true } });
  const i = list.findIndex((c) => c.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((c, idx) => db.serviceCategory.update({ where: { id: c.id }, data: { sortOrder: idx } })));
  invalidate();
}

export async function deleteCategory(id: string): Promise<FormState> {
  await requireAdmin();
  if ((await db.service.count({ where: { categoryId: id } })) > 0) return { message: "Сначала перенесите или удалите услуги категории" };
  await db.serviceCategory.delete({ where: { id } });
  invalidate();
  return { ok: true, message: "Категория удалена" };
}
