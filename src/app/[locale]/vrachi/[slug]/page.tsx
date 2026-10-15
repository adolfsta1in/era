import { CalendarCheck, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NearestSlots } from "@/components/doctors/nearest-slots";
import { DoctorAvatar } from "@/components/site/doctor-avatar";
import { JsonLd } from "@/components/site/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { ServiceRow } from "@/components/site/service-row";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCatalog, getDoctorBySlug, getDoctors } from "@/lib/data";
import { priceLabel, yearsSince } from "@/lib/i18n-format";
import { getLocale } from "@/lib/locale";
import { tr } from "@/lib/localized";
import { localizedUrl } from "@/lib/seo/jsonld";
import { pageAlternates } from "@/lib/seo/metadata";
import { getClinic } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export async function generateStaticParams() {
  const doctors = await getDoctors();
  return doctors.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/vrachi/[slug]">): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) return {};
  const name = tr(doctor.name, locale);
  const description = `${tr(doctor.specialty, locale)}. ${tr(doctor.bio, locale)}`.slice(0, 200);
  return {
    title: name,
    description,
    alternates: pageAlternates(locale, `/vrachi/${slug}`),
    openGraph: { title: name, description, type: "profile" },
  };
}

export default async function DoctorPage({ params }: PageProps<"/[locale]/vrachi/[slug]">) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) notFound();

  const [{ services }, clinic, t, tc, tn, tcta] = await Promise.all([
    getCatalog(),
    getClinic(),
    getTranslations({ locale, namespace: "doctors" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "cta" }),
  ]);

  const name = tr(doctor.name, locale);
  const doctorServices = services.filter((s) => doctor.serviceIds.includes(s.id));
  const experience =
    doctor.experienceSince > 0 ? tc("experience", { years: tc("years", { count: yearsSince(doctor.experienceSince) }) }) : "";

  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={[
          { label: tn("doctors"), href: "/vrachi" },
          { label: name, href: `/vrachi/${doctor.slug}` },
        ]}
        title={name}
        lead={tr(doctor.specialty, locale)}
        className="lg:hidden"
      />

      <div className="container-page grid gap-10 pb-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:pt-10">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <DoctorAvatar
            name={name}
            photoUrl={doctor.photoUrl}
            seed={doctor.slug}
            alt={t("photoAlt", { name })}
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="aspect-[5/4] rounded-[2rem] sm:aspect-[16/10] lg:aspect-[4/5]"
          />
        </div>

        <div className="min-w-0">
          <div className="hidden lg:block">
            <p className="text-sm text-muted-foreground">
              <Link href="/vrachi" className="hover:text-ink">
                {tn("doctors")}
              </Link>
            </p>
            <h1 className="mt-3 text-5xl leading-[1.05] font-bold tracking-[-0.03em]">{name}</h1>
            <p className="mt-3 text-xl text-muted-foreground">{tr(doctor.specialty, locale)}</p>
          </div>
          {experience && (
            <p className="inline-flex rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary-soft-foreground lg:mt-6">
              {experience}
            </p>
          )}

          <section aria-labelledby="doctor-about" className="mt-8">
            <h2 id="doctor-about" className="sr-only">
              {t("about")}
            </h2>
            <p className="text-lg leading-relaxed text-foreground/90">{tr(doctor.bio, locale)}</p>
          </section>

          <section aria-labelledby="doctor-slots" className="mt-10 rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 id="doctor-slots" className="text-xl font-bold">
                {t("nearestSlots")}
              </h2>
              <Button asChild>
                <Link href={`/booking?doctor=${doctor.slug}`}>
                  <CalendarCheck /> {tcta("bookToDoctor")}
                </Link>
              </Button>
            </div>
            <NearestSlots
              doctorSlug={doctor.slug}
              locale={locale}
              labels={{ today: tc("today"), tomorrow: tc("tomorrow"), noSlots: t("noSlots"), loading: tc("loading") }}
            />
          </section>

          {doctor.education.length > 0 && (
            <section aria-labelledby="doctor-edu" className="mt-12">
              <h2 id="doctor-edu" className="text-2xl font-bold">
                {t("education")}
              </h2>
              <ul className="mt-5 space-y-3">
                {doctor.education.map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <GraduationCap className="size-4" aria-hidden />
                    </span>
                    <span className="pt-1 leading-relaxed">{tr(e, locale)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {doctorServices.length > 0 && (
            <section aria-labelledby="doctor-services" className="mt-12">
              <h2 id="doctor-services" className="text-2xl font-bold">
                {t("services")}
              </h2>
              <ul className="mt-4 divide-y rounded-3xl border bg-surface/60">
                {doctorServices.map((s) => (
                  <li key={s.id}>
                    <ServiceRow
                      href={`/uslugi/${s.slug}`}
                      name={tr(s.name, locale)}
                      duration={tc("durationShort", { count: s.durationMin })}
                      price={priceLabel(tc, s.priceFrom)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Physician",
          name,
          description: tr(doctor.bio, locale),
          medicalSpecialty: "Dentistry",
          url: localizedUrl(locale, `/vrachi/${doctor.slug}`),
          image: doctor.photoUrl ? new URL(doctor.photoUrl, siteUrl()).toString() : undefined,
          worksFor: { "@id": `${siteUrl()}/#clinic` },
          address: { "@type": "PostalAddress", streetAddress: tr(clinic.address, locale), addressCountry: "KG" },
          telephone: clinic.phones[0],
        }}
      />
    </>
  );
}
