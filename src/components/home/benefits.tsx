import { BadgeCheck, Check, ClipboardList, HeartHandshake, QrCode, ShieldCheck, Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import type { Locale } from "@/i18n/routing";
import { getCatalog } from "@/lib/data";
import { priceLabel } from "@/lib/i18n-format";
import { tr } from "@/lib/localized";

const ITEMS = [
  { key: "plan", Icon: ClipboardList },
  { key: "painless", Icon: HeartHandshake },
  { key: "sterile", Icon: ShieldCheck },
  { key: "xray", Icon: Stethoscope },
  { key: "warranty", Icon: BadgeCheck },
  { key: "kids", Icon: QrCode },
] as const;

export async function Benefits({ locale }: { locale: Locale }) {
  const [t, tc, { services }] = await Promise.all([
    getTranslations({ locale, namespace: "home.benefits" }),
    getTranslations({ locale, namespace: "common" }),
    getCatalog(),
  ]);
  const [first, ...rest] = ITEMS;
  // Пример «плана лечения» из реальных услуг и цен клиники.
  const planRows = services.filter((s) => s.isPopular).slice(0, 3);

  return (
    <section className="section" aria-labelledby="benefits-title">
      <div className="container-page">
        <SectionHeading id="benefits-title" eyebrow={t("eyebrow")} title={t("title")} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Первый пункт — главный аргумент, выделен крупно (2×2 на десктопе) */}
          <Reveal className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-ink p-8 text-white md:col-span-2 lg:row-span-2 lg:p-10">
            <div
              aria-hidden
              className="absolute -top-20 -right-20 size-64 rounded-full bg-primary opacity-40 blur-3xl"
            />
            <first.Icon className="relative size-10 text-primary-soft" aria-hidden />
            <div className="relative mt-10 grid gap-8 lg:mt-16 lg:grid-cols-[1fr_1.05fr] lg:items-end">
              <div>
                <h3 className="font-heading text-2xl font-bold text-white sm:text-3xl">{t(`items.${first.key}.title`)}</h3>
                <p className="mt-4 text-base leading-relaxed text-white/75">{t(`items.${first.key}.text`)}</p>
              </div>
              {planRows.length > 0 && (
                <ul className="rotate-[-1.5deg] rounded-2xl bg-card p-2 text-ink shadow-lift" aria-hidden>
                  {planRows.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-3 odd:bg-muted/70">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {i === 0 ? <Check className="size-3.5" /> : <span className="text-[0.7rem] font-bold">{i + 1}</span>}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{tr(s.name, locale)}</span>
                      <span className="text-sm font-bold whitespace-nowrap">{priceLabel(tc, s.priceFrom)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
          {rest.map(({ key, Icon }, i) => (
            <Reveal
              key={key}
             
              className={`group rounded-3xl border bg-card p-6 transition-shadow hover:shadow-lift lg:p-7 ${i === rest.length - 1 ? "md:col-span-2 lg:col-span-1" : ""}`}
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold">{t(`items.${key}.title`)}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{t(`items.${key}.text`)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
