"use client";

import { useActionState, useState } from "react";
import { saveDoctor } from "@/app/admin/(panel)/doctors/actions";
import { DoctorAvatar } from "@/components/site/doctor-avatar";
import { Input } from "@/components/ui/input";
import type { LocalizedText } from "@/config/clinic";
import type { FormState } from "@/lib/admin/form";
import { Field, LocalizedInput, Section, SubmitButton, SwitchField, useFormToast } from "../form-ui";

export type DoctorFormValues = {
  id?: string;
  slug: string;
  name: LocalizedText;
  specialty: LocalizedText;
  bio: LocalizedText;
  education: LocalizedText[];
  experienceSince: number;
  photoUrl: string | null;
  isActive: boolean;
};

export function DoctorForm({ doctor }: { doctor?: DoctorFormValues }) {
  const [state, action] = useActionState<FormState, FormData>(saveDoctor, {});
  useFormToast(state);
  const [preview, setPreview] = useState<string | null>(doctor?.photoUrl ?? null);
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      {doctor?.id && <input type="hidden" name="id" value={doctor.id} />}
      <Section title="Профиль" description="Кыргызский текст необязателен — если поле пустое, на сайте показывается русский.">
        <LocalizedInput name="name" label="Имя и фамилия" defaultValue={doctor?.name} required error={e.name} />
        <LocalizedInput name="specialty" label="Специализация" defaultValue={doctor?.specialty} />
        <LocalizedInput name="bio" label="О враче" defaultValue={doctor?.bio} multiline rows={4} />
        <LocalizedInput
          name="education"
          label="Образование и курсы"
          multiline
          rows={4}
          hint="Каждый пункт — с новой строки. Строки на кыргызском — в том же порядке."
          defaultValue={{
            ru: doctor?.education.map((e) => e.ru).join("\n") ?? "",
            ky: doctor?.education.map((e) => e.ky).join("\n") ?? "",
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Год начала практики" htmlFor="experienceSince" error={e.experienceSince} hint="Стаж на сайте считается автоматически; 0 — не показывать">
            <Input id="experienceSince" name="experienceSince" type="number" min={0} max={2100} defaultValue={doctor?.experienceSince ?? 2015} />
          </Field>
          <Field label="Адрес страницы" htmlFor="slug" error={e.slug} hint="Если пусто — из имени: /vrachi/timur-aliev">
            <Input id="slug" name="slug" defaultValue={doctor?.slug} pattern="[a-z0-9-]*" />
          </Field>
        </div>
        <SwitchField name="isActive" label="Показывать на сайте" defaultChecked={doctor?.isActive ?? true} hint="Скрытый врач не виден на сайте и в онлайн-записи" />
      </Section>

      <Section title="Фото" description="Вертикальное фото 4:5, от 800×1000 px. Без фото показывается нейтральная заглушка.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- превью локального файла (blob:)
            <img src={preview} alt="" className="aspect-[4/5] w-32 rounded-2xl object-cover" />
          ) : (
            <DoctorAvatar name={doctor?.name.ru ?? "?"} photoUrl={null} seed={doctor?.slug ?? "new"} alt="" className="aspect-[4/5] w-32 rounded-2xl" />
          )}
          <div className="space-y-3">
            <Field label="Загрузить фото" htmlFor="photo" error={e.photo} hint="JPG, PNG или WebP до 4 МБ">
              <Input
                id="photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  if (f) setPreview(URL.createObjectURL(f));
                }}
                className="h-auto py-2"
              />
            </Field>
            {doctor?.photoUrl && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="removePhoto" className="size-4 accent-[var(--primary)]" /> Удалить фото
              </label>
            )}
          </div>
        </div>
      </Section>

      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <SubmitButton className="shadow-lift">{doctor?.id ? "Сохранить профиль" : "Создать врача"}</SubmitButton>
      </div>
    </form>
  );
}
