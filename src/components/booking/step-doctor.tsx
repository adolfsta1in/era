"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { DoctorAvatar } from "@/components/site/doctor-avatar";
import { OptionCard } from "./option-card";
import type { WizardDoctor } from "./types";

export function StepDoctor({
  doctors,
  selected,
  onSelect,
}: {
  doctors: WizardDoctor[];
  selected?: string;
  onSelect: (d: WizardDoctor | "any") => void;
}) {
  const t = useTranslations("booking.doctor");
  const td = useTranslations("doctors");

  if (doctors.length === 0) {
    return <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">{t("none")}</p>;
  }

  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {doctors.length > 1 && (
        <li className="sm:col-span-2">
          <OptionCard selected={selected === "any"} onClick={() => onSelect("any")}>
            <span className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                <Users className="size-6" aria-hidden />
              </span>
              <span>
                <span className="block font-heading font-bold text-ink">{t("any")}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{t("anyHint")}</span>
              </span>
            </span>
          </OptionCard>
        </li>
      )}
      {doctors.map((d) => (
        <li key={d.id}>
          <OptionCard selected={selected === d.id} onClick={() => onSelect(d)}>
            <span className="flex items-center gap-4">
              <DoctorAvatar
                name={d.name}
                photoUrl={d.photoUrl}
                seed={d.slug}
                alt={td("photoAlt", { name: d.name })}
                sizes="56px"
                showInitials={false}
                className="size-14 shrink-0 rounded-2xl"
              />
              <span className="min-w-0">
                <span className="block font-heading font-bold text-ink">{d.name}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{d.specialty}</span>
                {d.experience && (
                  <span className="mt-1 block text-xs font-medium text-primary-soft-foreground">{d.experience}</span>
                )}
              </span>
            </span>
          </OptionCard>
        </li>
      ))}
    </ul>
  );
}
