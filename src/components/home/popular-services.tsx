import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { ServiceRow } from "@/components/site/service-row";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getCatalog } from "@/lib/data";
import { servicePrice } from "@/lib/i18n-format";
import { tr } from "@/lib/localized";

export async function PopularServices({ locale }: { locale: Locale }) {
  const [{ services, categories }, t, tc, tcta] = await Promise.all([
    getCatalog(),
    getTranslations({ locale, namespace: "home.services" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "cta" }),
  ]);
  const popular = services.filter((s) => s.isPopular).slice(0, 8);
  if (popular.length === 0) return null;
  const categoryName = (id: string) => tr(categories.find((c) => c.id === id)?.name, locale);

  return (
    <section className="section bg-surface" aria-labelledby="services-title">
      <div className="container-page">
        <SectionHeading
          id="services-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
          action={
            <Button asChild variant="outline" size="lg" className="self-start lg:self-auto">
              <Link href="/uslugi">
                {tcta("allServices")} <ArrowRight />
              </Link>
            </Button>
          }
        />
        <ul className="grid gap-x-10 md:grid-cols-2">
          {popular.map((s) => (
            <Reveal as="li" key={s.id} className="border-b border-border/80">
              <ServiceRow
                href={`/uslugi/${s.slug}`}
                category={categoryName(s.categoryId)}
                name={tr(s.name, locale)}
                description={tr(s.shortDescription, locale)}
                duration={tc("durationShort", { count: s.durationMin })}
                price={servicePrice(tc, s)}
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
