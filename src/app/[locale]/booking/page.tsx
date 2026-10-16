import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BookingWizard, type WizardData } from "@/components/booking/wizard";
import { WizardSkeleton } from "@/components/booking/wizard-skeleton";
import { Toaster } from "@/components/ui/sonner";
import { getCatalog, getDoctors } from "@/lib/data";
import { servicePrice, yearsSince } from "@/lib/i18n-format";
import { getLocale } from "@/lib/locale";
import { tr } from "@/lib/localized";
import { pageAlternates } from "@/lib/seo/metadata";
import { getClinic } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("bookingTitle"),
    description: t("bookingDescription"),
    alternates: pageAlternates(locale, "/booking"),
  };
}

export default async function BookingPage() {
  const locale = await getLocale();
  const [{ services, categories }, doctors, clinic, t, tc, messages] = await Promise.all([
    getCatalog(),
    getDoctors(),
    getClinic(),
    getTranslations({ locale, namespace: "booking" }),
    getTranslations({ locale, namespace: "common" }),
    getMessages({ locale }),
  ]);

  // Только то, что нужно мастеру, уже на нужном языке.
  const data: WizardData = {
    categories: categories.map((c) => ({ id: c.id, name: tr(c.name, locale) })),
    services: services
      .filter((s) => s.doctorIds.length > 0)
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        categoryId: s.categoryId,
        name: tr(s.name, locale),
        description: tr(s.shortDescription, locale),
        durationMin: s.durationMin,
        durationLabel: tc("durationShort", { count: s.durationMin }),
        priceLabel: servicePrice(tc, s),
        doctorIds: s.doctorIds,
      })),
    doctors: doctors.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: tr(d.name, locale),
      specialty: tr(d.specialty, locale),
      photoUrl: d.photoUrl,
      experience: d.experienceSince > 0 ? tc("experience", { years: tc("years", { count: yearsSince(d.experienceSince) }) }) : "",
    })),
    clinic: {
      name: clinic.name,
      address: tr(clinic.address, locale),
      phone: clinic.phones[0] ?? "",
      whatsapp: clinic.whatsapp,
      horizonDays: clinic.bookingHorizonDays,
    },
  };

  return (
    <div className="container-page pt-6 pb-24 sm:pt-10">
      <div className="mb-8 max-w-2xl sm:mb-10">
        <h1 className="text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("lead")}</p>
      </div>
      <NextIntlClientProvider
        messages={{
          booking: messages.booking,
          common: messages.common,
          services: messages.services,
          doctors: messages.doctors,
          locale: messages.locale,
          cta: messages.cta,
          mobileBar: messages.mobileBar,
        }}
      >
        <Suspense fallback={<WizardSkeleton />}>
          <BookingWizard data={data} />
        </Suspense>
        <Toaster position="top-center" />
      </NextIntlClientProvider>
    </div>
  );
}
