"use client";

import { CalendarDays, ExternalLink, Images, LayoutDashboard, LogOut, MessageSquareQuote, Settings, Stethoscope, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Сводка", short: "Сводка", Icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Записи", short: "Записи", Icon: CalendarDays },
  { href: "/admin/doctors", label: "Врачи", short: "Врачи", Icon: UsersRound },
  { href: "/admin/services", label: "Услуги и цены", short: "Услуги", Icon: Stethoscope },
  { href: "/admin/works", label: "До и после", short: "До/после", Icon: Images },
  { href: "/admin/content", label: "Отзывы и FAQ", short: "Контент", Icon: MessageSquareQuote, desktopOnly: true },
  { href: "/admin/settings", label: "Настройки", short: "Настройки", Icon: Settings },
];

type IsActive = (href: string, exact?: boolean) => boolean;

function useActive(): IsActive {
  const pathname = usePathname();
  return (href, exact) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
}

const never: IsActive = () => false;

/** Меню с подсветкой текущего раздела. Без Suspense-обёртки usePathname блокирует пререндер, поэтому
 *  в layout оно обёрнуто в <Suspense>, а в fallback — та же разметка без подсветки (…Static). */
export function AdminSidebar({ clinicName }: { clinicName: string }) {
  return <SidebarView clinicName={clinicName} isActive={useActive()} />;
}

export function AdminSidebarStatic({ clinicName }: { clinicName: string }) {
  return <SidebarView clinicName={clinicName} isActive={never} />;
}

function SidebarView({ clinicName, isActive }: { clinicName: string; isActive: IsActive }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
      <div className="border-b px-6 py-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Админка</p>
        <p className="mt-1 truncate font-heading text-lg font-bold text-ink">{clinicName}</p>
      </div>
      <nav aria-label="Разделы админки" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {ADMIN_NAV.map(({ href, label, Icon, exact }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href, exact) ? "page" : undefined}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-ink aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-soft-foreground"
              >
                <Icon className="size-[1.1rem]" aria-hidden /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-1 border-t p-3">
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-ink"
        >
          <ExternalLink className="size-[1.1rem]" aria-hidden /> Открыть сайт
        </a>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-ink"
          >
            <LogOut className="size-[1.1rem]" aria-hidden /> Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminTopbar({ clinicName }: { clinicName: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/90 px-4 backdrop-blur lg:hidden">
      <p className="truncate font-heading font-bold text-ink">{clinicName}</p>
      <div className="flex items-center gap-1">
        <Link href="/admin/content" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Отзывы и FAQ">
          <MessageSquareQuote className="size-5" />
        </Link>
        <a href="/" target="_blank" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Открыть сайт">
          <ExternalLink className="size-5" />
        </a>
        <form action={logout}>
          <button type="submit" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Выйти">
            <LogOut className="size-5" />
          </button>
        </form>
      </div>
    </header>
  );
}

export function AdminBottomNav() {
  return <BottomNavView isActive={useActive()} />;
}

export function AdminBottomNavStatic() {
  return <BottomNavView isActive={never} />;
}

function BottomNavView({ isActive }: { isActive: IsActive }) {
  return (
    <nav
      aria-label="Разделы админки"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-6">
        {ADMIN_NAV.filter((i) => !i.desktopOnly).map(({ href, short, Icon, exact }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href, exact) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium text-muted-foreground",
                "aria-[current=page]:text-primary",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {short}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
