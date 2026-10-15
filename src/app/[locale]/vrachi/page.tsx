import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CtaBand } from "@/components/site/cta-band";
import { DoctorCard } from "@/components/site/doctor-card";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/site/reveal";
import { getDoctors } from "@/lib/data";
import { yearsSince } from "@/lib/i18n-format";
import { getLocale } from "@/lib/locale";
import { tr } from "@/lib/localized";
import { pageAlternates } from "@/lib/seo/metadata";
import { getClinic } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const [t, clinic] = await Promise.all([getTranslations({ locale, namespace: "meta" }), getClinic()]);
  const description = t("doctorsDescription", { name: clinic.name });
  return {
    title: t("doctorsTitle"),
    description,
    alternates: pageAlternates(locale, "/vrachi"),
    openGraph: { title: t("doctorsTitle"), description },
  };
}

export default async function DoctorsPage() {
  const locale = await getLocale();
  const [doctors, clinic, t, tc, tn] = await Promise.all([
    getDoctors(),
    getClinic(),
    getTranslations({ locale, namespace: "doctors" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  return (
    <>
      <PageHeader locale={locale} crumbs={[{ label: tn("doctors"), href: "/vrachi" }]} title={t("title")} lead={t("lead")} />
      <div className="container-page pb-8">
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d, i) => {
            const name = tr(d.name, locale);
            return (
              <Reveal as="li" key={d.id}>
                <DoctorCard
                  priority={i < 2}
                  doctor={{
                    slug: d.slug,
                    name,
                    specialty: tr(d.specialty, locale),
                    experience: d.experienceSince > 0 ? tc("experience", { years: tc("years", { count: yearsSince(d.experienceSince) }) }) : "",
                    photoUrl: d.photoUrl,
                    photoAlt: t("photoAlt", { name }),
                  }}
                />
              </Reveal>
            );
          })}
        </ul>
      </div>
      <CtaBand clinic={clinic} locale={locale} />
    </>
  );
}
