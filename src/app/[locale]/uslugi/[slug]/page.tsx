import { CalendarCheck, Clock, Phone, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DoctorAvatar } from "@/components/site/doctor-avatar";
import { JsonLd } from "@/components/site/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { ServiceRow } from "@/components/site/service-row";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCatalog, getDoctors, getServiceBySlug } from "@/lib/data";
import { telHref } from "@/lib/format";
import { priceLabel, yearsSince } from "@/lib/i18n-format";
import { getLocale } from "@/lib/locale";
import { tr } from "@/lib/localized";
import { localizedUrl } from "@/lib/seo/jsonld";
import { pageAlternates } from "@/lib/seo/metadata";
import { getClinic } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export async function generateStaticParams() {
  const { services } = await getCatalog();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/uslugi/[slug]">): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const found = await getServiceBySlug(slug);
  if (!found) return {};
  const tc = await getTranslations({ locale, namespace: "common" });
  const name = tr(found.service.name, locale);
  const description = `${tr(found.service.shortDescription, locale)}. ${priceLabel(tc, found.service.priceFrom)}.`;
  return {
    title: name,
    description,
    alternates: pageAlternates(locale, `/uslugi/${slug}`),
    openGraph: { title: name, description },
  };
}

export default async function ServicePage({ params }: PageProps<"/[locale]/uslugi/[slug]">) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const found = await getServiceBySlug(slug);
  if (!found) notFound();
  const { service, category, services } = found;

  const [doctors, clinic, t, tc, tn, tcta, td] = await Promise.all([
    getDoctors(),
    getClinic(),
    getTranslations({ locale, namespace: "services" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "cta" }),
    getTranslations({ locale, namespace: "doctors" }),
  ]);

  const name = tr(service.name, locale);
  const serviceDoctors = doctors.filter((d) => service.doctorIds.includes(d.id));
  const related = services.filter((s) => s.categoryId === service.categoryId && s.id !== service.id).slice(0, 4);
  const paragraphs = tr(service.description, locale).split(/\n{2,}/);
  const phone = clinic.phones[0];

  return (
    <>
      <PageHeader
        locale={locale}
        crumbs={[
          { label: tn("services"), href: "/uslugi" },
          { label: name, href: `/uslugi/${service.slug}` },
        ]}
        eyebrow={
          <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-soft-foreground">
            {tr(category.name, locale)}
          </span>
        }
        title={name}
        lead={tr(service.shortDescription, locale)}
      />

      <div className="container-page grid gap-10 pb-16 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <div className="min-w-0">
          <section aria-labelledby="about-service">
            <h2 id="about-service" className="text-2xl font-bold">
              {t("aboutService")}
            </h2>
            <div className="prose-clinic mt-4">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section aria-labelledby="service-doctors" className="mt-12">
            <h2 id="service-doctors" className="text-2xl font-bold">
              {t("doctorsTitle")}
            </h2>
            {serviceDoctors.length === 0 ? (
              <p className="mt-4 text-muted-foreground">{t("noDoctors")}</p>
            ) : (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {serviceDoctors.map((d) => {
                  const dn = tr(d.name, locale);
                  return (
                    <li key={d.id} className="flex items-center gap-4 rounded-3xl border bg-card p-3 pr-4">
                      <Link href={`/vrachi/${d.slug}`} className="shrink-0">
                        <DoctorAvatar
                          name={dn}
                          photoUrl={d.photoUrl}
                          seed={d.slug}
                          alt={td("photoAlt", { name: dn })}
                          sizes="80px"
                          showInitials={false}
                          className="size-20 rounded-2xl"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/vrachi/${d.slug}`} className="font-heading font-bold text-ink hover:text-primary">
                          {dn}
                        </Link>
                        <p className="mt-0.5 text-sm text-muted-foreground">{tr(d.specialty, locale)}</p>
                        {d.experienceSince > 0 && (
                          <p className="mt-1 text-xs font-medium text-primary-soft-foreground">
                            {tc("experience", { years: tc("years", { count: yearsSince(d.experienceSince) }) })}
                          </p>
                        )}
                      </div>
                      <Button asChild size="sm" variant="soft" className="shrink-0">
                        <Link href={`/booking?service=${service.slug}&doctor=${d.slug}`}>{tcta("bookShort")}</Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-7">
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <div>
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="size-4 text-primary" aria-hidden /> {t("price")}
                </dt>
                <dd className="mt-1 font-heading text-2xl font-bold text-ink">
                  {priceLabel(tc, service.priceFrom, service.priceTo, "range")}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4 text-primary" aria-hidden /> {t("duration")}
                </dt>
                <dd className="mt-1 font-heading text-2xl font-bold text-ink">
                  {tc("minutes", { count: service.durationMin })}
                </dd>
              </div>
            </dl>
            <div className="mt-6 grid gap-2">
              <Button asChild size="lg">
                <Link href={`/booking?service=${service.slug}`}>
                  <CalendarCheck /> {tcta("bookService")}
                </Link>
              </Button>
              {phone && (
                <Button asChild size="lg" variant="outline">
                  <a href={telHref(phone)}>
                    <Phone /> {phone}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-surface py-14 sm:py-16" aria-labelledby="related-title">
          <div className="container-page">
            <h2 id="related-title" className="mb-6 text-2xl font-bold sm:text-3xl">
              {t("otherServices")}
            </h2>
            <ul className="grid gap-x-10 md:grid-cols-2">
              {related.map((s) => (
                <li key={s.id} className="border-b border-border/80">
                  <ServiceRow
                    href={`/uslugi/${s.slug}`}
                    name={tr(s.name, locale)}
                    description={tr(s.shortDescription, locale)}
                    duration={tc("durationShort", { count: s.durationMin })}
                    price={priceLabel(tc, s.priceFrom)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": ["Service", "MedicalProcedure"],
          name,
          description: tr(service.shortDescription, locale),
          url: localizedUrl(locale, `/uslugi/${service.slug}`),
          serviceType: tr(category.name, locale),
          provider: { "@id": `${siteUrl()}/#clinic` },
          areaServed: { "@type": "City", name: "Бишкек" },
          offers: {
            "@type": "Offer",
            priceCurrency: "KGS",
            price: service.priceFrom,
            priceSpecification: {
              "@type": "PriceSpecification",
              priceCurrency: "KGS",
              minPrice: service.priceFrom,
              ...(service.priceTo ? { maxPrice: service.priceTo } : {}),
            },
          },
        }}
      />
    </>
  );
}
