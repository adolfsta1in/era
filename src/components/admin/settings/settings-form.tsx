"use client";

import { Check } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { saveSettings } from "@/app/admin/(panel)/settings/actions";
import { LogoMark } from "@/components/site/logo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ClinicConfig } from "@/config/clinic";
import { THEMES, THEME_IDS, themeToCss, type ThemeId } from "@/config/themes";
import type { FormState } from "@/lib/admin/form";
import { cn } from "@/lib/utils";
import { Field, LocalizedInput, Section, SubmitButton, useFormToast } from "../form-ui";

const DAYS = [
  ["1", "Понедельник"],
  ["2", "Вторник"],
  ["3", "Среда"],
  ["4", "Четверг"],
  ["5", "Пятница"],
  ["6", "Суббота"],
  ["0", "Воскресенье"],
] as const;

export function SettingsForm({ clinic }: { clinic: ClinicConfig }) {
  const [state, action] = useActionState<FormState, FormData>(saveSettings, {});
  useFormToast(state);
  const e = state.errors ?? {};
  const [theme, setTheme] = useState<ThemeId>(clinic.theme);
  const [logoPreview, setLogoPreview] = useState<string | null>(clinic.logoUrl);

  // Живое превью: тема сразу применяется к админке, на сайт — после сохранения.
  useEffect(() => {
    let el = document.getElementById("theme-preview") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "theme-preview";
      document.head.appendChild(el);
    }
    el.textContent = themeToCss(theme);
    return () => {
      el?.remove();
    };
  }, [theme]);

  return (
    <form action={action} className="space-y-5">
      <Section title="Цветовая тема" description="Применяется ко всему сайту и админке. Выберите — и посмотрите превью прямо здесь.">
        <div role="radiogroup" aria-label="Тема" className="grid gap-3 sm:grid-cols-3">
          {THEME_IDS.map((id) => {
            const t = THEMES[id];
            const active = theme === id;
            return (
              <label
                key={id}
                className={cn(
                  "relative cursor-pointer rounded-2xl border-2 p-4 transition-colors",
                  active ? "border-primary bg-primary-soft/40" : "border-border hover:border-input",
                )}
              >
                <input type="radio" name="theme" value={id} checked={active} onChange={() => setTheme(id)} className="sr-only" />
                <div className="flex gap-1.5" aria-hidden>
                  {t.swatches.map((c) => (
                    <span key={c} className="size-8 rounded-full ring-1 ring-black/5" style={{ background: c }} />
                  ))}
                </div>
                <p className="mt-3 font-semibold text-ink">{t.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t.description}</p>
                {active && (
                  <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {/* Мини-превью сайта в выбранной теме */}
        <div className="overflow-hidden rounded-2xl border" style={{ background: THEMES[theme].tokens.background }} aria-hidden>
          <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: THEMES[theme].tokens.border }}>
            <LogoMark className="size-7" />
            <span className="font-heading text-sm font-bold" style={{ color: THEMES[theme].tokens.ink }}>
              {clinic.shortName}
            </span>
            <span
              className="ml-auto rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: THEMES[theme].tokens.primary, color: THEMES[theme].tokens["primary-foreground"] }}
            >
              Записаться
            </span>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="font-heading text-xl font-bold" style={{ color: THEMES[theme].tokens.ink }}>
                {clinic.tagline.ru}
              </p>
              <p className="mt-1 text-xs" style={{ color: THEMES[theme].tokens["muted-foreground"] }}>
                {clinic.description.ru}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: THEMES[theme].tokens["primary-soft"] }}>
              <p className="text-xs" style={{ color: THEMES[theme].tokens["primary-soft-foreground"] }}>
                Ближайшее время
              </p>
              <p className="font-heading font-bold" style={{ color: THEMES[theme].tokens.ink }}>
                Завтра, 09:00
              </p>
            </div>
          </div>
        </div>
        {e.theme && <p className="text-sm text-destructive">{e.theme}</p>}
      </Section>

      <Section title="Клиника">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название" htmlFor="name" error={e.name}>
            <Input id="name" name="name" defaultValue={clinic.name} required />
          </Field>
          <Field label="Короткое название (в шапке)" htmlFor="shortName" error={e.shortName}>
            <Input id="shortName" name="shortName" defaultValue={clinic.shortName} />
          </Field>
        </div>
        <LocalizedInput name="tagline" label="Слоган (заголовок на главной)" defaultValue={clinic.tagline} />
        <LocalizedInput name="description" label="Описание для поиска и соцсетей" defaultValue={clinic.description} multiline rows={2} />
        <LocalizedInput name="about" label="О клинике" defaultValue={clinic.about} multiline rows={5} />
      </Section>

      <Section title="Логотип" description="SVG или PNG с прозрачным фоном, горизонтальный. Без логотипа показывается знак и название.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 min-w-40 items-center justify-center rounded-2xl border bg-background px-4">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- превью загружаемого файла
              <img src={logoPreview} alt="" className="max-h-10 w-auto" />
            ) : (
              <span className="flex items-center gap-2">
                <LogoMark className="size-8" />
                <span className="font-heading font-bold text-ink">{clinic.shortName}</span>
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Input
              name="logo"
              type="file"
              accept="image/svg+xml,image/png,image/webp,image/jpeg"
              aria-label="Файл логотипа"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                if (f) setLogoPreview(URL.createObjectURL(f));
              }}
              className="h-auto py-2"
            />
            {e.logo && <p className="text-sm text-destructive">{e.logo}</p>}
            {clinic.logoUrl && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="removeLogo" className="size-4 accent-[var(--primary)]" /> Убрать логотип
              </label>
            )}
          </div>
        </div>
      </Section>

      <Section title="Контакты">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Телефоны" htmlFor="phones" hint="Каждый с новой строки. Первый — основной (кнопка «Позвонить»).">
            <Textarea id="phones" name="phones" rows={3} defaultValue={clinic.phones.join("\n")} />
          </Field>
          <div className="space-y-4">
            <Field label="WhatsApp" htmlFor="whatsapp" hint="Номер цифрами: 996555000000">
              <Input id="whatsapp" name="whatsapp" defaultValue={clinic.whatsapp} inputMode="tel" />
            </Field>
            <Field label="E-mail" htmlFor="email" error={e.email}>
              <Input id="email" name="email" type="email" defaultValue={clinic.email} />
            </Field>
          </div>
          <Field label="Telegram" htmlFor="telegram" hint="Имя пользователя без @">
            <Input id="telegram" name="telegram" defaultValue={clinic.telegram} />
          </Field>
          <Field label="Instagram" htmlFor="instagram" hint="Имя аккаунта без @">
            <Input id="instagram" name="instagram" defaultValue={clinic.instagram} />
          </Field>
        </div>
        <LocalizedInput name="address" label="Адрес" defaultValue={clinic.address} />
        <LocalizedInput name="addressNote" label="Как нас найти" defaultValue={clinic.addressNote} />
      </Section>

      <Section title="Карта 2GIS">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Широта" htmlFor="lat" error={e.lat}>
            <Input id="lat" name="lat" inputMode="decimal" defaultValue={clinic.lat} />
          </Field>
          <Field label="Долгота" htmlFor="lng" error={e.lng}>
            <Input id="lng" name="lng" inputMode="decimal" defaultValue={clinic.lng} />
          </Field>
        </div>
        <Field label="Ссылка на карточку в 2GIS" htmlFor="twoGisUrl" error={e.twoGisUrl} hint="Для кнопки «Построить маршрут»">
          <Input id="twoGisUrl" name="twoGisUrl" defaultValue={clinic.twoGisUrl} />
        </Field>
        <Field
          label="Ссылка для виджета карты (iframe)"
          htmlFor="mapEmbedUrl"
          error={e.mapEmbedUrl}
          hint="2GIS → «Поделиться» → «Карта для сайта» → скопируйте адрес из src. Пусто — показывается стилизованная схема с кнопкой маршрута."
        >
          <Input id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={clinic.mapEmbedUrl} placeholder="https://widgets.2gis.com/widget?type=firmsonmap&options=…" />
        </Field>
      </Section>

      <Section title="Часы работы клиники" description="Показываются на сайте. График врачей настраивается отдельно в карточке врача.">
        {e.hours && <p className="text-sm text-destructive">{e.hours}</p>}
        <ul className="divide-y rounded-2xl border">
          {DAYS.map(([d, label]) => {
            const h = clinic.workingHours[d];
            return (
              <li key={d} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <label className="flex w-40 items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name={`hours.${d}.on`} defaultChecked={Boolean(h)} className="size-4 accent-[var(--primary)]" />
                  {label}
                </label>
                <Input type="time" name={`hours.${d}.open`} defaultValue={h?.open ?? "09:00"} aria-label={`${label}: открытие`} className="h-9 w-28" />
                <span>—</span>
                <Input type="time" name={`hours.${d}.close`} defaultValue={h?.close ?? "18:00"} aria-label={`${label}: закрытие`} className="h-9 w-28" />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Онлайн-запись">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Минимум до визита, мин" htmlFor="bookingLeadMinutes" error={e.bookingLeadMinutes} hint="120 — записаться можно не раньше, чем через 2 часа">
            <Input id="bookingLeadMinutes" name="bookingLeadMinutes" type="number" min={0} step={15} defaultValue={clinic.bookingLeadMinutes} />
          </Field>
          <Field label="Запись на дней вперёд" htmlFor="bookingHorizonDays" error={e.bookingHorizonDays}>
            <Input id="bookingHorizonDays" name="bookingHorizonDays" type="number" min={1} max={180} defaultValue={clinic.bookingHorizonDays} />
          </Field>
          <Field label="Шаг сетки времени" htmlFor="slotStepMinutes" error={e.slotStepMinutes}>
            <select
              id="slotStepMinutes"
              name="slotStepMinutes"
              defaultValue={clinic.slotStepMinutes}
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            >
              {[5, 10, 15, 20, 30, 60].map((v) => (
                <option key={v} value={v}>
                  {v} минут
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Цифры на сайте">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Год открытия (0 — не показывать)" htmlFor="foundedYear" error={e.foundedYear}>
            <Input id="foundedYear" name="foundedYear" type="number" defaultValue={clinic.foundedYear} />
          </Field>
          <Field label="Пациентов (0 — не показывать)" htmlFor="patientsCount" error={e.patientsCount}>
            <Input id="patientsCount" name="patientsCount" type="number" min={0} step={100} defaultValue={clinic.patientsCount} />
          </Field>
          <Field label="Рейтинг (из 5)" htmlFor="rating" error={e.rating}>
            <Input id="rating" name="rating" type="number" min={0} max={5} step={0.1} defaultValue={clinic.rating} />
          </Field>
        </div>
      </Section>

      <Section title="Юридические данные" description="Подставляются в политику конфиденциальности.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Юрлицо" htmlFor="legalName">
            <Input id="legalName" name="legalName" defaultValue={clinic.legalName} />
          </Field>
          <Field label="ИНН" htmlFor="legalInn">
            <Input id="legalInn" name="legalInn" defaultValue={clinic.legalInn} />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <SubmitButton className="shadow-lift">Сохранить настройки</SubmitButton>
      </div>
    </form>
  );
}
