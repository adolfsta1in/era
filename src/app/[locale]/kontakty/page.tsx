import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactDetails } from "@/components/site/contact-details";
import { PageHeader } from "@/components/site/page-header";
import { getLocale } from "@/lib/locale";
import { tr } from "@/lib/localized";
import { pageAlternates } from "@/lib/seo/metadata";
import { getClinic } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const [t, clinic] = await Promise.all([getTranslations({ locale, namespace: "meta" }), getClinic()]);
  return {
    title: t("contactsTitle"),
    description: `${tr(clinic.address, locale)} · ${clinic.phones.join(", ")}`,
    alternates: pageAlternates(locale, "/kontakty"),
  };
}

export default async function ContactsPage() {
  const locale = await getLocale();
  const [clinic, t, tn] = await Promise.all([
    getClinic(),
    getTranslations({ locale, namespace: "contacts" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  return (
    <>
      <PageHeader locale={locale} crumbs={[{ label: tn("contacts"), href: "/kontakty" }]} title={t("title")} lead={t("lead")} />
      <div className="container-page pb-16">
        <ContactDetails clinic={clinic} locale={locale} />
        <div className="mt-6 rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
          <h2 className="mb-2 font-sans text-xs font-semibold tracking-[0.14em] uppercase">{t("requisites")}</h2>
          <p>
            {[clinic.legalName, clinic.legalInn && `ИНН ${clinic.legalInn}`, clinic.email].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
    </>
  );
}
