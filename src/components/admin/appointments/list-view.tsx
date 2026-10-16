import { MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import type { AdminAppointment } from "@/lib/admin/appointments";
import { tr } from "@/lib/localized";
import { formatDateLong, formatTime, toDateKey } from "@/lib/time";
import { formatKgPhone } from "@/lib/validators/phone";
import { StatusSelect } from "./status-select";

/** Список записей, сгруппированный по дням. На мобильном — карточки, на десктопе — строки таблицы. */
export function ListView({ appointments }: { appointments: AdminAppointment[] }) {
  if (appointments.length === 0) {
    return <p className="rounded-3xl border border-dashed bg-card p-10 text-center text-muted-foreground">Записей не найдено</p>;
  }

  const days = new Map<string, AdminAppointment[]>();
  for (const a of appointments) {
    const key = toDateKey(a.startAt);
    days.set(key, [...(days.get(key) ?? []), a]);
  }

  return (
    <div className="space-y-6">
      {[...days.entries()].map(([day, items]) => (
        <section key={day} aria-labelledby={`day-${day}`}>
          <h2 id={`day-${day}`} className="mb-2 flex items-baseline gap-2 px-1 font-heading text-base font-bold first-letter:uppercase">
            <span className="first-letter:uppercase">{formatDateLong(day, "ru")}</span>
            <span className="text-sm font-medium text-muted-foreground">{items.length}</span>
          </h2>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="sr-only md:not-sr-only">
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Время</th>
                  <th className="px-4 py-2.5 font-medium">Пациент</th>
                  <th className="px-4 py-2.5 font-medium">Услуга и врач</th>
                  <th className="px-4 py-2.5 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((a) => (
                  <tr key={a.id} className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-4 md:table-row md:p-0">
                    <td className="md:px-4 md:py-3 md:align-top">
                      <Link href={`/admin/appointments/${a.id}`} className="font-heading text-base font-bold text-ink tabular-nums hover:text-primary">
                        {formatTime(a.startAt)}
                      </Link>
                      <span className="block text-xs text-muted-foreground tabular-nums">до {formatTime(a.endAt)}</span>
                    </td>
                    <td className="min-w-0 md:px-4 md:py-3 md:align-top">
                      <Link href={`/admin/appointments/${a.id}`} className="block truncate font-semibold text-ink hover:text-primary">
                        {a.patientName}
                      </Link>
                      {a.patientPhone ? (
                        <a href={`tel:${a.patientPhone}`} className="mt-0.5 inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
                          <Phone className="size-3.5" aria-hidden />
                          {formatKgPhone(a.patientPhone)}
                        </a>
                      ) : (
                        <span className="mt-0.5 block text-sm text-muted-foreground">Без телефона</span>
                      )}
                      {a.comment && (
                        <p className="mt-1 flex gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="mt-0.5 size-3 shrink-0" aria-hidden />
                          <span className="line-clamp-2">{a.comment}</span>
                        </p>
                      )}
                    </td>
                    <td className="col-start-2 min-w-0 md:px-4 md:py-3 md:align-top">
                      <span className="block truncate font-medium text-ink">{tr(a.service.name, "ru")}</span>
                      <span className="block truncate text-muted-foreground">{tr(a.doctor.name, "ru")}</span>
                    </td>
                    <td className="col-start-2 md:px-4 md:py-3 md:align-top">
                      <StatusSelect id={a.id} status={a.status} />
                      <span className="mt-1 block text-[0.7rem] text-muted-foreground">
                        {a.source === "admin" ? "Админка" : "Сайт"} · {a.publicCode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
