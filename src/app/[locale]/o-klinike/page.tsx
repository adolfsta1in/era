import { Check } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Benefits } from "@/components/home/benefits";
import { CtaBand } from "@/components/site/cta-band";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/site/reveal";
import { formatNumber } from "@/lib/format";
import { yearsSince } from "@/lib/i18n-format";
import { getLocale } from "@/lib/locale";
import { tr } from "@/lib/localized";
import { pageAlternates } from "@/lib/seo/metadata";
import { getClinic } from "@/lib/settings";

/** Фото работ врача (из Instagram клиники). Подписи — about.works в messages, по порядку. */
const WORK_PHOTOS = [
  "/works/work-veneers-smile.webp",
  "/works/work-front-resto.webp",
  "/works/work-molar-resto.webp",
  "/works/work-zirconia.webp",
  "/works/work-crowns-front.webp",
  "/works/work-total-smile.webp",
  "/works/work-crowns-lab.webp",
  "/works/work-denture.webp",
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const [t, clinic] = await Promise.all([getTranslations({ locale, namespace: "meta" }), getClinic()]);
  return {
    title: t("aboutTitle"),
    description: tr(clinic.about, locale).slice(0, 180),
    alternates: pageAlternates(locale, "/o-klinike"),
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const [clinic, t, th, tn] = await Promise.all([
    getClinic(),
    getTranslations({ locale, namespace: "about" }),
    getTranslations({ locale, namespace: "home.hero" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);
  const values = ["1", "2", "3"] as const;
  const equipment = t.raw("equipment") as string[];
  const workTitles = t.raw("works") as string[];
  const stats = [
    clinic.foundedYear > 0 && { value: `${yearsSince(clinic.foundedYear)}`, label: th("statYears") },
    clinic.patientsCount > 0 && { value: `${formatNumber(clinic.patientsCount)}+`, label: th("statPatients") },
    { value: clinic.rating.toFixed(1).replace(".", ","), label: th("statRating") },
  ].filter((s) => s !== false);

  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={[{ label: tn("about"), href: "/o-klinike" }]}
        title={clinic.name}
        lead={tr(clinic.tagline, locale)}
      />

      <div className="container-page grid gap-10 pb-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <p className="text-xl leading-relaxed text-foreground/90 sm:text-2xl sm:leading-relaxed">{tr(clinic.about, locale)}</p>
        <dl className="grid grid-cols-3 gap-4 self-start rounded-3xl bg-ink p-6 text-white sm:p-8 lg:grid-cols-1">
          {stats.map((s) => (
            <div key={s.label} className="lg:border-b lg:border-white/10 lg:pb-5 lg:last:border-0 lg:last:pb-0">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-heading text-3xl font-bold text-white sm:text-5xl">{s.value}</dd>
              <dd className="mt-1 text-sm text-white/65">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="container-page py-12" aria-labelledby="values-title">
        <h2 id="values-title" className="section-title">
          {t("valuesTitle")}
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {values.map((v) => (
            <Reveal as="li" key={v} className="rounded-3xl border bg-card p-7">
              <span className="font-heading text-sm font-bold text-primary">0{v}</span>
              <h3 className="mt-4 text-xl font-bold">{t(`values.${v}.title`)}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t(`values.${v}.text`)}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="container-page py-12" aria-labelledby="equipment-title">
        <div className="grid gap-8 rounded-[2rem] bg-surface p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 id="equipment-title" className="section-title">
            {t("equipmentTitle")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {equipment.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-card p-4">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-12" aria-labelledby="works-title">
        <h2 id="works-title" className="section-title">
          {t("worksTitle")}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("worksLead")}</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {WORK_PHOTOS.map((src, i) => (
            <Reveal as="li" key={src} className="overflow-hidden rounded-3xl border bg-card">
              <div className="relative aspect-[4/3]">
                <Image src={src} alt={workTitles[i] ?? ""} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </div>
              <p className="px-4 py-3 text-sm leading-snug font-medium text-ink">{workTitles[i]}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <Benefits locale={locale} />
      <CtaBand clinic={clinic} locale={locale} />
    </>
  );
}
