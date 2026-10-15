import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BeforeAfter } from "@/components/home/before-after";
import { Benefits } from "@/components/home/benefits";
import { ContactsSection } from "@/components/home/contacts-section";
import { DoctorsSection } from "@/components/home/doctors-section";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { PopularServices } from "@/components/home/popular-services";
import { Reviews } from "@/components/home/reviews";
import { Steps } from "@/components/home/steps";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/site/section-heading";
import { getBeforeAfterCases } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { tr } from "@/lib/localized";
import { pageAlternates } from "@/lib/seo/metadata";
import { getClinic } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { alternates: pageAlternates(locale, "/") };
}

export default async function HomePage() {
  const locale = await getLocale();
  const [clinic, tba, cases] = await Promise.all([
    getClinic(),
    getTranslations({ locale, namespace: "home.beforeAfter" }),
    getBeforeAfterCases(),
  ]);

  return (
    <>
      <Hero clinic={clinic} locale={locale} />
      <Benefits locale={locale} />
      <PopularServices locale={locale} />
      <DoctorsSection locale={locale} />
      <Steps locale={locale} />
      {cases.length > 0 && (
        <section className="section" aria-labelledby="ba-title">
          <div className="container-page">
            <SectionHeading id="ba-title" eyebrow={tba("eyebrow")} title={tba("title")} lead={tba("lead")} />
            <BeforeAfter
              labels={{ before: tba("before"), after: tba("after"), slider: tba("sliderLabel") }}
              items={cases.map((c) => ({
                id: c.id,
                title: tr(c.title, locale),
                description: tr(c.description, locale),
                beforeUrl: c.beforeUrl,
                afterUrl: c.afterUrl,
              }))}
            />
          </div>
        </section>
      )}
      <Reviews locale={locale} />
      <Faq locale={locale} />
      <ContactsSection clinic={clinic} locale={locale} />
      <CtaBand clinic={clinic} locale={locale} />
    </>
  );
}
