"use client";

import { ChevronDown, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { deleteCase, moveCase, saveCase } from "@/app/admin/(panel)/works/actions";
import { Button } from "@/components/ui/button";
import type { LocalizedText } from "@/config/clinic";
import { compressImage } from "@/lib/admin/compress-image";
import type { FormState } from "@/lib/admin/form";
import { cn } from "@/lib/utils";
import { Field, LocalizedInput, SubmitButton, SwitchField, useFormToast } from "../form-ui";
import { SortButtons } from "../sort-buttons";

export type WorkItem = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  beforeUrl: string;
  afterUrl: string;
  isPublished: boolean;
};

/** Выбор фото с превью. Файл сжимается в браузере при отправке формы (см. WorkForm). */
function PhotoPicker({ name, label, initial, error }: { name: string; label: string; initial?: string; error?: string }) {
  const [preview, setPreview] = useState<string | null>(initial ?? null);
  const id = `${name}-${initial ?? "new"}`;
  return (
    <Field label={label} htmlFor={id} error={error}>
      <label
        htmlFor={id}
        className={cn(
          "relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/40 text-muted-foreground hover:border-primary",
          error && "border-destructive",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- превью локального файла (blob:), next/image не нужен
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm font-medium">
            <ImagePlus className="size-7" aria-hidden />
            Выбрать фото
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(ev) => {
          const f = ev.target.files?.[0];
          if (f) setPreview(URL.createObjectURL(f));
        }}
      />
      {preview && <p className="mt-1.5 text-xs text-muted-foreground">Нажмите на фото, чтобы заменить</p>}
    </Field>
  );
}

function WorkForm({ work, onDone }: { work?: WorkItem; onDone?: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    // Фото с телефона весят мегабайты — уменьшаем перед отправкой.
    for (const key of ["before", "after"]) {
      const f = fd.get(key);
      if (f instanceof File && f.size > 0) fd.set(key, await compressImage(f));
    }
    const res = await saveCase(prev, fd);
    if (res.ok) onDone?.();
    return res;
  }, {});
  useFormToast(state);
  const [pending, startTransition] = useTransition();
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      {work && <input type="hidden" name="id" value={work.id} />}
      <div className="grid grid-cols-2 gap-3">
        <PhotoPicker name="before" label="Фото «до»" initial={work?.beforeUrl} error={e.before} />
        <PhotoPicker name="after" label="Фото «после»" initial={work?.afterUrl} error={e.after} />
      </div>
      <p className="text-xs text-muted-foreground">
        Лучше снимать «до» и «после» с одного ракурса — тогда ползунок на сайте смотрится аккуратно. Не публикуйте лица без
        согласия пациента.
      </p>
      <LocalizedInput name="title" label="Название работы" defaultValue={work?.title} required error={e.title} hint="Например: «Виниры на 6 зубов»" />
      <LocalizedInput name="description" label="Описание" defaultValue={work?.description} multiline rows={3} hint="Что было и что сделали — 1–2 предложения" />
      <SwitchField name="isPublished" label="Показывать на сайте" defaultChecked={work?.isPublished ?? true} />
      <div className="flex justify-between gap-2">
        {work ? (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => confirm("Удалить работу с сайта?") && startTransition(() => deleteCase(work.id))}
          >
            <Trash2 /> Удалить
          </Button>
        ) : (
          <span />
        )}
        <SubmitButton>{work ? "Сохранить" : "Добавить на сайт"}</SubmitButton>
      </div>
    </form>
  );
}

function WorkCard({ work, aside }: { work: WorkItem; aside: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-2 p-2 pr-3">
        {aside}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left hover:bg-muted"
        >
          <span className="flex shrink-0 gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- миниатюры в админке */}
            <img src={work.beforeUrl} alt="" className="size-12 rounded-lg object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element -- миниатюры в админке */}
            <img src={work.afterUrl} alt="" className="size-12 rounded-lg object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-ink">{work.title.ru}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {work.isPublished ? work.description.ru || "Без описания" : "Скрыта"}
            </span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>
      {open && (
        <div className="border-t p-4 sm:p-5">
          <WorkForm work={work} />
        </div>
      )}
    </div>
  );
}

export function WorksEditor({ works }: { works: WorkItem[] }) {
  const [adding, setAdding] = useState(works.length === 0);
  return (
    <section aria-labelledby="works-h" className="max-w-3xl space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="works-h" className="text-lg font-bold">
          Работы ({works.length})
        </h2>
        <Button variant="outline" size="sm" onClick={() => setAdding((a) => !a)}>
          <Plus /> Добавить
        </Button>
      </div>
      {adding && (
        <div className="rounded-2xl border bg-card p-4 sm:p-5">
          <WorkForm onDone={() => setAdding(false)} />
        </div>
      )}
      {works.map((w, i) => (
        <WorkCard
          key={w.id}
          work={w}
          aside={<SortButtons onMove={(d) => moveCase(w.id, d)} first={i === 0} last={i === works.length - 1} label={w.title.ru} />}
        />
      ))}
    </section>
  );
}
