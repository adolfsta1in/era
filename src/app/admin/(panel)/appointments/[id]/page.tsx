import { ArrowLeft, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/icons";
import { DeleteAppointmentButton } from "@/components/admin/appointments/delete-button";
import { RescheduleForm } from "@/components/admin/appointments/reschedule-form";
import { StatusSelect } from "@/components/admin/appointments/status-select";
import { Button } from "@/components/ui/button";
import { appointmentInclude } from "@/lib/admin/appointments";
import { db } from "@/lib/db";
import { formatNumber, whatsappHref } from "@/lib/format";
import { tr } from "@/lib/localized";
import { formatDateLong, formatDateShort, formatTime, toDateKey } from "@/lib/time";
import { formatKgPhone } from "@/lib/validators/phone";

export const metadata: Metadata = { title: "Запись" };

export default async function AppointmentPage({ params }: PageProps<"/admin/appointments/[id]">) {
  const { id } = await params;
  const a = await db.appointment.findUnique({ where: { id }, include: appointmentInclude });
  if (!a) notFound();
  const canReschedule = a.status === "NEW" || a.status === "CONFIRMED";
  const serviceDoctors = canReschedule
    ? await db.doctorService.findMany({
        where: { serviceId: a.serviceId, doctor: { isActive: true } },
        select: { doctor: { select: { id: true, name: true, sortOrder: true } } },
      })
    : [];
  const doctorOptions = serviceDoctors
    .map((d) => d.doctor)
    .sort((x, y) => x.sortOrder - y.sortOrder)
    .map((d) => ({ id: d.id, name: tr(d.name, "ru") }));
  // Текущий врач должен быть в списке, даже если его потом отвязали от услуги.
  if (canReschedule && !doctorOptions.some((d) => d.id === a.doctorId)) {
    doctorOptions.unshift({ id: a.doctorId, name: tr(a.doctor.name, "ru") });
  }

  const rows: [string, React.ReactNode][] = [
    ["Дата", <span key="d" className="first-letter:uppercase">{formatDateLong(a.startAt, "ru")}</span>],
    ["Время", `${formatTime(a.startAt)}–${formatTime(a.endAt)}`],
    ["Услуга", `${tr(a.service.name, "ru")} · от ${formatNumber(a.service.priceFrom)} сом`],
    ["Врач", tr(a.doctor.name, "ru")],
    ["Пациент", a.patientName],
    [
      "Телефон",
      a.patientPhone ? (
        <a key="p" href={`tel:${a.patientPhone}`} className="text-primary hover:underline">
          {formatKgPhone(a.patientPhone)}
        </a>
      ) : (
        "—"
      ),
    ],
    ["Комментарий", a.comment || "—"],
    ["Источник", a.source === "admin" ? "Админка" : `Сайт (${a.locale === "ky" ? "кыргызская" : "русская"} версия)`],
    ["Номер записи", a.publicCode],
    ["Создана", `${formatDateShort(a.createdAt)} ${formatTime(a.createdAt)}`],
    ["Согласие на обработку ПДн", a.consentAt ? `${formatDateShort(a.consentAt)} ${formatTime(a.consentAt)}` : "—"],
  ];

  return (
    <div className="max-w-3xl">
      <Link href="/admin/appointments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> Все записи
      </Link>
      <div className="rounded-3xl border bg-card">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h1 className="text-2xl font-bold">{a.patientName}</h1>
            <p className="mt-1 text-muted-foreground first-letter:uppercase">
              {formatDateLong(a.startAt, "ru")}, {formatTime(a.startAt)}
            </p>
          </div>
          <StatusSelect id={a.id} status={a.status} className="h-10 w-48 text-sm" />
        </div>
        <dl className="divide-y px-5 sm:px-6">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2 border-t p-5 sm:p-6">
          {a.patientPhone && (
            <>
              <Button asChild>
                <a href={`tel:${a.patientPhone}`}>
                  <Phone /> Позвонить
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={whatsappHref(a.patientPhone, `Здравствуйте, ${a.patientName}! Это клиника — подтверждаем вашу запись на ${formatDateShort(a.startAt)} в ${formatTime(a.startAt)}.`)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="size-4 text-[#1DA851]" /> WhatsApp
                </a>
              </Button>
            </>
          )}
          {canReschedule && (
            <RescheduleForm
              key={`${a.startAt.toISOString()}-${a.doctorId}`}
              appointmentId={a.id}
              serviceId={a.serviceId}
              doctorId={a.doctorId}
              date={toDateKey(a.startAt)}
              today={toDateKey(new Date())}
              doctors={doctorOptions}
            />
          )}
          <div className="ml-auto">
            <DeleteAppointmentButton id={a.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
