"use client";

import { useActionState } from "react";
import { saveService } from "@/app/admin/(panel)/services/actions";
import { Input } from "@/components/ui/input";
import type { LocalizedText } from "@/config/clinic";
import type { FormState } from "@/lib/admin/form";
import { Field, LocalizedInput, Section, SubmitButton, SwitchField, useFormToast } from "../form-ui";

export type ServiceFormValues = {
  id?: string;
  slug: string;
  categoryId: string;
  name: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  durationMin: number;
  priceFrom: number;
  priceTo: number | null;
  currency: string;
  isPopular: boolean;
  isActive: boolean;
  doctorIds: string[];
};

export function ServiceForm({
  service,
  categories,
  doctors,
}: {
  service?: ServiceFormValues;
  categories: { id: string; name: string }[];
  doctors: { id: string; name: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveService, {});
  useFormToast(state);
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      {service?.id && <input type="hidden" name="id" value={service.id} />}
      <Section title="Описание">
        <Field label="Категория" htmlFor="categoryId" error={e.categoryId}>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={service?.categoryId ?? categories[0]?.id}
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <LocalizedInput name="name" label="Название" defaultValue={service?.name} required error={e.name} />
        <LocalizedInput name="shortDescription" label="Кратко (одна строка в прайсе)" defaultValue={service?.shortDescription} />
        <LocalizedInput
          name="description"
          label="Подробное описание"
          defaultValue={service?.description}
          multiline
          rows={6}
          hint="Абзацы разделяйте пустой строкой"
        />
      </Section>

      <Section title="Цена и длительность">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Валюта" htmlFor="currency" hint="Обычно сом; доллары — для услуг в $">
            <select
              id="currency"
              name="currency"
              defaultValue={service?.currency ?? "KGS"}
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            >
              <option value="KGS">сом</option>
              <option value="USD">доллары ($)</option>
            </select>
          </Field>
          <Field label="Цена от" htmlFor="priceFrom" error={e.priceFrom}>
            <Input id="priceFrom" name="priceFrom" type="number" min={0} step={50} required defaultValue={service?.priceFrom ?? 1000} />
          </Field>
          <Field label="Цена до" htmlFor="priceTo" error={e.priceTo} hint="Необязательно">
            <Input id="priceTo" name="priceTo" type="number" min={0} step={50} defaultValue={service?.priceTo ?? ""} />
          </Field>
          <Field label="Длительность, мин" htmlFor="durationMin" error={e.durationMin} hint="Влияет на расчёт слотов">
            <Input id="durationMin" name="durationMin" type="number" min={5} max={480} step={5} required defaultValue={service?.durationMin ?? 30} />
          </Field>
        </div>
      </Section>

      <Section title="Врачи" description="Кто оказывает услугу — к ним можно записаться онлайн.">
        <div className="grid gap-1 sm:grid-cols-2">
          {doctors.map((d) => (
            <label key={d.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted">
              <input
                type="checkbox"
                name="doctorIds"
                value={d.id}
                defaultChecked={service?.doctorIds.includes(d.id)}
                className="size-4 accent-[var(--primary)]"
              />
              <span className="text-sm">{d.name}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Публикация">
        <SwitchField name="isActive" label="Показывать на сайте" defaultChecked={service?.isActive ?? true} />
        <SwitchField name="isPopular" label="Популярная услуга" defaultChecked={service?.isPopular ?? false} hint="Показывается на главной странице" />
        <Field label="Адрес страницы" htmlFor="slug" error={e.slug} hint="Если пусто — из названия: /uslugi/lechenie-kariesa">
          <Input id="slug" name="slug" defaultValue={service?.slug} pattern="[a-z0-9-]*" />
        </Field>
      </Section>

      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <SubmitButton className="shadow-lift">{service?.id ? "Сохранить услугу" : "Создать услугу"}</SubmitButton>
      </div>
    </form>
  );
}
