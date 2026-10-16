import type { Metadata } from "next";
import { Geologica, Onest } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { themeToCss } from "@/config/themes";
import { getClinic } from "@/lib/settings";
import "../globals.css";

const display = Geologica({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-display", display: "swap" });
const body = Onest({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Админка", template: "%s · Админка" },
  robots: { index: false, follow: false },
  // Админку можно поставить на экран «Домой» (iPhone/Android) или установить из Chrome — откроется
  // отдельным приложением с иконкой ERA. Манифест только у админки: сайт для пациентов остаётся сайтом.
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "ERA Админка", statusBarStyle: "default" },
};

async function ThemeStyle() {
  const clinic = await getClinic();
  return <style dangerouslySetInnerHTML={{ __html: themeToCss(clinic.theme) }} />;
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <head>
        <Suspense>
          <ThemeStyle />
        </Suspense>
      </head>
      <body className="min-h-dvh bg-surface/50">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
