import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { PasswordForm } from "@/components/admin/settings/password-form";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { getClinic } from "@/lib/settings";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const clinic = await getClinic();
  return (
    <div className="max-w-4xl">
      <PageTitle title="Настройки клиники" description="Всё, что видят пациенты: название, контакты, часы работы, цвета." />
      <SettingsForm clinic={clinic} />
      <div className="mt-8">
        <PasswordForm />
      </div>
    </div>
  );
}
