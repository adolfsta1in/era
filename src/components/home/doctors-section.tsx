import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getDoctors } from "@/lib/data";
import { yearsSince } from "@/lib/i18n-format";
import { tr } from "@/lib/localized";
import { DoctorsCarousel } from "./doctors-carousel";

export async function DoctorsSection({ locale }: { locale: Locale }) {
  const [doctors, t, tc, td, tcta] = await Promise.all([
    getDoctors(),
    getTranslations({ locale, namespace: "home.doctors" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "doctors" }),
    getTranslations({ locale, namespace: "cta" }),
  ]);
  if (doctors.length === 0) return null;

  const cards = doctors.map((d) => {
    const name = tr(d.name, locale);
    return {
      slug: d.slug,
      name,
      specialty: tr(d.specialty, locale),
      experience: d.experienceSince > 0 ? tc("experience", { years: tc("years", { count: yearsSince(d.experienceSince) }) }) : "",
      photoUrl: d.photoUrl,
      photoAlt: td("photoAlt", { name }),
    };
  });

  return (
    <section className="section overflow-hidden" aria-labelledby="doctors-title">
      <div className="container-page">
        <SectionHeading
          id="doctors-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
          action={
            <Button asChild variant="outline" size="lg" className="self-start lg:self-auto">
              <Link href="/vrachi">
                {tcta("allDoctors")} <ArrowRight />
              </Link>
            </Button>
          }
        />
        <DoctorsCarousel doctors={cards} labels={{ prev: t("prev"), next: t("next") }} />
      </div>
    </section>
  );
}
