"use server";

import { revalidatePath, updateTag } from "next/cache";
import { bool, file, localized, str, type FormState } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/auth/session";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { saveImage, UploadError } from "@/lib/storage";

function invalidate() {
  updateTag(TAGS.content);
  revalidatePath("/admin/works");
}

export async function saveCase(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id") || null;
  const title = localized(fd, "title");
  const description = localized(fd, "description");
  const errors: Record<string, string> = {};
  if (title.ru.length < 2) errors.title = "Укажите название";

  const before = file(fd, "before");
  const after = file(fd, "after");
  if (!id && !before) errors.before = "Загрузите фото «до»";
  if (!id && !after) errors.after = "Загрузите фото «после»";
  if (Object.keys(errors).length) return { errors, message: Object.values(errors)[0] };

  let beforeUrl: string | undefined;
  let afterUrl: string | undefined;
  try {
    if (before) beforeUrl = await saveImage(before, "works");
    if (after) afterUrl = await saveImage(after, "works");
  } catch (e) {
    if (e instanceof UploadError) return { message: e.message };
    throw e;
  }

  const data = { title, description, isPublished: bool(fd, "isPublished") };
  if (id) {
    await db.beforeAfterCase.update({ where: { id }, data: { ...data, ...(beforeUrl ? { beforeUrl } : {}), ...(afterUrl ? { afterUrl } : {}) } });
  } else {
    const max = await db.beforeAfterCase.aggregate({ _max: { sortOrder: true } });
    await db.beforeAfterCase.create({
      data: { ...data, beforeUrl: beforeUrl!, afterUrl: afterUrl!, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    });
  }
  invalidate();
  return { ok: true, message: id ? "Сохранено" : "Работа добавлена на сайт" };
}

export async function deleteCase(id: string): Promise<void> {
  await requireAdmin();
  await db.beforeAfterCase.delete({ where: { id } });
  invalidate();
}

export async function moveCase(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const list = await db.beforeAfterCase.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true } });
  const i = list.findIndex((x) => x.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((x, idx) => db.beforeAfterCase.update({ where: { id: x.id }, data: { sortOrder: idx } })));
  invalidate();
}
