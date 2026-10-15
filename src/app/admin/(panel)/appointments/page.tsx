import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentFilters } from "@/components/admin/appointments/filters";
import { DayView } from "@/components/admin/appointments/day-view";
import { ListView } from "@/components/admin/appointments/list-view";
import { WeekView } from "@/components/admin/appointments/week-view";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/ui/button";
import { appointmentsForRange, listAppointments, parseFilters, todayKey } from "@/lib/admin/appointments";
import { db } from "@/lib/db";
import { tr } from "@/lib/localized";
import type { ScheduleExceptionInput } from "@/lib/slots/engine";
import { addDays, formatDateLong, isDateKey, weekdayOf } from "@/lib/time";

export const metadata: Metadata = { title: "Записи" };

export default async function AppointmentsPage({ searchParams }: PageProps<"/admin/appointments">) {
  const sp = await searchParams;
  const view = sp.view === "day" || sp.view === "week" ? sp.view : "list";
  const filters = parseFilters(sp);
  const today = await todayKey();
  const anchor = typeof sp.date === "string" && isDateKey(sp.date) ? sp.date : today;

  const doctors = await db.doctor.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { scheduleRules: true, exceptions: { where: { date: anchor } } },
  });
  const doctorOptions = doctors.map((d) => ({ id: d.id, name: tr(d.name, "ru") }));

  const navHref = (date: string) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
    p.set("date", date);
    return `/admin/appointments?${p}`;
  };

  let content: React.ReactNode;
  let rangeLabel: string | null = null;
  let step = 1;

  if (view === "day") {
    const items = (await appointmentsForRange(anchor, anchor, filters.doctor)).filter((a) => !filters.status || a.status === filters.status);
    const cols = doctors
      .filter((d) => !filters.doctor || d.id === filters.doctor)
      .map((d) => ({
        id: d.id,
        name: tr(d.name, "ru"),
        rules: d.scheduleRules,
        exceptions: d.exceptions.map((e) => ({ ...e, type: e.type as ScheduleExceptionInput["type"] })),
      }));
    content = <DayView date={anchor} doctors={cols} appointments={items} />;
    rangeLabel = formatDateLong(anchor, "ru");
  } else if (view === "week") {
    step = 7;
    const weekStart = addDays(anchor, -((weekdayOf(anchor) + 6) % 7));
    const items = (await appointmentsForRange(weekStart, addDays(weekStart, 6), filters.doctor)).filter(
      (a) => !filters.status || a.status === filters.status,
    );
    content = <WeekView weekStart={weekStart} today={today} appointments={items} />;
    rangeLabel = `${formatDateLong(weekStart, "ru").split(", ")[1]} — ${formatDateLong(addDays(weekStart, 6), "ru").split(", ")[1]}`;
  } else {
    // По умолчанию — предстоящие записи начиная с сегодняшнего дня.
    const effective = filters.from || filters.to || filters.q ? filters : { ...filters, from: today };
    content = <ListView appointments={await listAppointments(effective)} />;
  }

  return (
    <>
      <PageTitle
        title="Записи"
        description="Новые записи с сайта приходят сюда."
        actions={
          <Button asChild>
            <Link href="/admin/appointments/new">
              <Plus /> Новая запись
            </Link>
          </Button>
        }
      />
      <AppointmentFilters doctors={doctorOptions} />
      {rangeLabel && (
        <div className="mt-5 mb-3 flex items-center gap-2">
          <Button asChild variant="outline" size="icon" aria-label="Назад">
            <Link href={navHref(addDays(anchor, -step))}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Вперёд">
            <Link href={navHref(addDays(anchor, step))}>
              <ChevronRight />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={navHref(today)}>Сегодня</Link>
          </Button>
          <p className="ml-1 font-heading text-lg font-bold first-letter:uppercase">{rangeLabel}</p>
        </div>
      )}
      <div className={rangeLabel ? "" : "mt-6"}>{content}</div>
    </>
  );
}
