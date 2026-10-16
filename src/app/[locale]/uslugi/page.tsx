import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ServicesBrowser } from "@/components/services/services-browser";
import { CtaBand } from "@/components/site/cta-band";
import { PageHeader } from "@/components/site/page-header";
import { getCatalog } from "@/lib/data";
import { servicePrice } from "@/lib/i18n-format";
import { getLocale } from "@/lib/locale";
import { tr } from "@/lib/localized";
import { pageAlternates } from "@/lib/seo/metadata";
import { getClinic } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("servicesTitle"),
    description: t("servicesDescription"),
    alternates: pageAlternates(locale, "/uslugi"),
    openGraph: { title: t("servicesTitle"), description: t("servicesDescription") },
  };
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const [{ services, categories }, clinic, t, tc, tn] = await Promise.all([
    getCatalog(),
    getClinic(),
    getTranslations({ locale, namespace: "services" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  return (
    <>
      <PageHeader locale={locale} crumbs={[{ label: tn("services"), href: "/uslugi" }]} title={t("title")} lead={t("lead")} />
      <div className="container-page pb-8">
        <ServicesBrowser
          categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: tr(c.name, locale) }))}
          services={services.map((s) => ({
            id: s.id,
            slug: s.slug,
            categoryId: s.categoryId,
            name: tr(s.name, locale),
            description: tr(s.shortDescription, locale),
            duration: tc("durationShort", { count: s.durationMin }),
            price: servicePrice(tc, s),
            // Поиск работает по обоим языкам.
            search: [s.name.ru, s.name.ky, s.shortDescription.ru, s.shortDescription.ky]
              .join(" ")
              .toLowerCase()
              .replace(/ё/g, "е"),
          }))}
          labels={{
            search: t("searchLabel"),
            placeholder: t("searchPlaceholder"),
            all: t("all"),
            empty: t.raw("empty") as string,
            categories: t("categoriesLabel"),
            clear: t("clear"),
          }}
        />
      </div>
      <CtaBand clinic={clinic} locale={locale} />
    </>
  );
}
