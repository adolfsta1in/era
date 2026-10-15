import { ArrowRight, BellRing, CalendarCheck, CalendarDays, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/appointments/status-badge";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/ui/button";
import { appointmentInclude, todayKey } from "@/lib/admin/appointments";
import { OCCUPYING } from "@/lib/appointment-status";
import { db } from "@/lib/db";
import { tr } from "@/lib/localized";
import { addDays, formatDateLong, formatTime, toDateKey, zonedToUtc } from "@/lib/time";
import { formatKgPhone } from "@/lib/validators/phone";

export const metadata: Metadata = { title: "Сводка" };

export default async function DashboardPage() {
  const today = await todayKey();
  const now = new Date();
  const dayStart = zonedToUtc(today, 0);
  const tomorrowStart = zonedToUtc(addDays(today, 1), 0);
  const weekEnd = zonedToUtc(addDays(today, 7), 0);

  const [todayCount, newCount, weekCount, upcoming, newOnes] = await Promise.all([
    db.appointment.count({ where: { startAt: { gte: dayStart, lt: tomorrowStart }, status: { in: OCCUPYING } } }),
    db.appointment.count({ where: { status: "NEW", startAt: { gte: now } } }),
    db.appointment.count({ where: { startAt: { gte: dayStart, lt: weekEnd }, status: { in: OCCUPYING } } }),
    db.appointment.findMany({
      where: { startAt: { gte: now }, status: { in: ["NEW", "CONFIRMED"] } },
      include: appointmentInclude,
      orderBy: { startAt: "asc" },
      take: 8,
    }),
    db.appointment.findMany({
      where: { status: "NEW", startAt: { gte: now } },
      include: appointmentInclude,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Сегодня", value: todayCount, href: `/admin/appointments?view=day&date=${today}`, Icon: CalendarCheck },
    { label: "Ждут подтверждения", value: newCount, href: "/admin/appointments?status=NEW", Icon: BellRing, accent: newCount > 0 },
    { label: "На 7 дней вперёд", value: weekCount, href: "/admin/appointments?view=week", Icon: CalendarDays },
  ];

  return (
    <>
      <PageTitle
        title="Сводка"
        description={formatDateLong(today, "ru").replace(/^./, (c) => c.toUpperCase())}
        actions={
          <Button asChild>
            <Link href="/admin/appointments/new">
              <Plus /> Новая запись
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, href, Icon, accent }) => (
          <Link
            key={label}
            href={href}
            className={`group rounded-3xl border p-5 transition-shadow hover:shadow-lift ${accent ? "border-warning/40 bg-warning/10" : "bg-card"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <Icon className="size-5 text-primary" aria-hidden />
            </div>
            <p className="mt-3 font-heading text-4xl font-bold text-ink">{value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="upcoming" className="rounded-3xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 id="upcoming" className="text-lg font-bold">
              Ближайшие визиты
            </h2>
            <Link href="/admin/appointments" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Все <ArrowRight className="size-4" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">Пока нет предстоящих записей</p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/appointments/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50">
                    <div className="w-16 shrink-0 text-center">
                      <p className="font-heading text-lg font-bold text-ink tabular-nums">{formatTime(a.startAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {toDateKey(a.startAt) === today ? "сегодня" : toDateKey(a.startAt) === addDays(today, 1) ? "завтра" : formatDateLong(a.startAt, "ru").split(", ")[1]}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{a.patientName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {tr(a.service.name, "ru")} · {tr(a.doctor.name, "ru")}
                      </p>
                    </div>
                    <StatusBadge status={a.status} className="hidden sm:inline-flex" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="new-ones" className="rounded-3xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 id="new-ones" className="text-lg font-bold">
              Новые заявки
            </h2>
            <p className="text-sm text-muted-foreground">Позвоните пациенту и подтвердите запись</p>
          </div>
          {newOnes.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">Все заявки обработаны</p>
          ) : (
            <ul className="divide-y">
              {newOnes.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/appointments/${a.id}`} className="block truncate font-semibold text-ink hover:text-primary">
                      {a.patientName}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {formatDateLong(a.startAt, "ru").split(", ")[1]}, {formatTime(a.startAt)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="soft">
                    <a href={`tel:${a.patientPhone}`}>{formatKgPhone(a.patientPhone)}</a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
