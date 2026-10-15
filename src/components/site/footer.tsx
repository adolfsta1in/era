import { MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { InstagramIcon, TelegramIcon, WhatsAppIcon } from "@/components/icons";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { instagramHref, telegramHref, telHref, whatsappHref } from "@/lib/format";
import { tr } from "@/lib/localized";
import type { ClinicSettings } from "@/lib/settings";
import { NAV_ITEMS } from "@/lib/site";
import { Logo } from "./logo";
import { WorkingHours } from "./working-hours";

export async function Footer({ clinic, locale }: { clinic: ClinicSettings; locale: Locale }) {
  const [t, tn, tc] = await Promise.all([
    getTranslations({ locale, namespace: "footer" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "cta" }),
  ]);
  const year = CURRENT_YEAR;

  const socials = [
    clinic.whatsapp && { href: whatsappHref(clinic.whatsapp), label: tc("whatsapp"), Icon: WhatsAppIcon },
    clinic.telegram && { href: telegramHref(clinic.telegram), label: tc("telegram"), Icon: TelegramIcon },
    clinic.instagram && { href: instagramHref(clinic.instagram), label: tc("instagram"), Icon: InstagramIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof WhatsAppIcon }[];

  return (
    <footer className="bg-ink text-white/90">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-16">
        <div className="space-y-5">
          <Logo name={clinic.shortName} logoUrl={clinic.logoUrl} inverted />
          <p className="max-w-xs text-sm leading-relaxed text-white/65">{tr(clinic.tagline, locale)}</p>
          <ul className="flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full bg-white/8 text-white transition-colors hover:bg-white/15"
                >
                  <Icon className="size-[1.15rem]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={t("navigation")}>
          <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
            {t("navigation")}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {NAV_ITEMS.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="transition-colors hover:text-white">
                  {tn(i.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/booking" className="transition-colors hover:text-white">
                {tc("book")}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
            {t("contacts")}
          </h2>
          <ul className="space-y-3 text-sm">
            {clinic.phones.map((p) => (
              <li key={p}>
                <a href={telHref(p)} className="flex items-center gap-2 transition-colors hover:text-white">
                  <Phone className="size-4 text-white/50" aria-hidden />
                  {p}
                </a>
              </li>
            ))}
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-white/50" aria-hidden />
              <span>{tr(clinic.address, locale)}</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
            {t("hours")}
          </h2>
          <WorkingHours hours={clinic.workingHours} locale={locale} tone="inverted" className="max-w-56" />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights", { year, name: clinic.name })}</p>
          {t("license") && <p>{t("license")}</p>}
          <Link href="/privacy" className="underline-offset-4 hover:text-white hover:underline">
            {t("privacy")}
          </Link>
        </div>
        {t("disclaimer") && <p className="container-page pb-6 text-xs text-white/40">{t("disclaimer")}</p>}
      </div>
    </footer>
  );
}

// Год фиксируется при сборке/ревалидации страницы, чтобы не делать страницу динамической.
const CURRENT_YEAR = new Date().getFullYear();
