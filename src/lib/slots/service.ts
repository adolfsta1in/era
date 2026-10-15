import "server-only";
import { getClinic } from "../settings";
import { addDays, type DateKey } from "../time";
import { db } from "../db";
import type { Prisma } from "@/generated/prisma/client";
import {
  bookingWindow,
  computeMergedSlots,
  type DoctorAvailability,
  type MergedSlot,
  type ScheduleExceptionInput,
} from "./engine";

/** Статусы, при которых запись занимает время врача. */
export const ACTIVE_STATUSES = ["NEW", "CONFIRMED", "COMPLETED"] as const;

type Tx = Prisma.TransactionClient | typeof db;

export async function getBookingSettings() {
  const clinic = await getClinic();
  return {
    stepMin: clinic.slotStepMinutes,
    leadMin: clinic.bookingLeadMinutes,
    horizonDays: clinic.bookingHorizonDays,
  };
}

/**
 * Загружает график, исключения и занятость врачей на диапазон дат.
 * excludeAppointmentId — не считать занятым время этой записи (перенос записи в админке).
 */
export async function loadAvailability(
  doctorIds: string[],
  from: DateKey,
  to: DateKey,
  client: Tx = db,
  excludeAppointmentId?: string,
): Promise<DoctorAvailability[]> {
  if (doctorIds.length === 0) return [];
  // Запас в сутки с каждой стороны — чтобы не потерять записи на границе дат.
  const rangeStart = new Date(`${addDays(from, -1)}T00:00:00Z`);
  const rangeEnd = new Date(`${addDays(to, 2)}T00:00:00Z`);

  const [rules, exceptions, appointments] = await Promise.all([
    client.scheduleRule.findMany({ where: { doctorId: { in: doctorIds } } }),
    client.scheduleException.findMany({ where: { doctorId: { in: doctorIds }, date: { gte: from, lte: to } } }),
    client.appointment.findMany({
      where: {
        doctorId: { in: doctorIds },
        status: { in: [...ACTIVE_STATUSES] },
        startAt: { lt: rangeEnd },
        endAt: { gt: rangeStart },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { doctorId: true, startAt: true, endAt: true },
    }),
  ]);

  return doctorIds.map((doctorId) => ({
    doctorId,
    rules: rules.filter((r) => r.doctorId === doctorId),
    exceptions: exceptions
      .filter((e) => e.doctorId === doctorId)
      .map((e) => ({ ...e, type: e.type as ScheduleExceptionInput["type"] })),
    busy: appointments
      .filter((a) => a.doctorId === doctorId)
      .map((a) => ({ start: a.startAt.getTime(), end: a.endAt.getTime() })),
  }));
}

/** Активные врачи, которые оказывают услугу (в порядке сортировки из админки). */
export async function doctorsForService(serviceId: string, client: Tx = db): Promise<string[]> {
  const rows = await client.doctorService.findMany({
    where: { serviceId, doctor: { isActive: true }, service: { isActive: true } },
    select: { doctorId: true, doctor: { select: { sortOrder: true } } },
  });
  return rows.sort((a, b) => a.doctor.sortOrder - b.doctor.sortOrder).map((r) => r.doctorId);
}

export type FindSlotsInput = {
  serviceId: string;
  durationMin: number;
  /** null — любой врач, оказывающий услугу */
  doctorId: string | null;
  from?: DateKey;
  to?: DateKey;
  now?: Date;
  /** Для админки: не учитывать минимальный отступ от текущего момента. */
  ignoreLead?: boolean;
  /** Перенос записи: её собственное время не считается занятым. */
  excludeAppointmentId?: string;
};

/** Свободные слоты по услуге и врачу (или по всем врачам услуги). */
export async function findSlots(input: FindSlotsInput): Promise<MergedSlot[]> {
  const now = input.now ?? new Date();
  const settings = await getBookingSettings();
  const window = bookingWindow(now, input.ignoreLead ? Math.max(settings.horizonDays, 90) : settings.horizonDays);
  const from = input.from && input.from > window.first ? input.from : window.first;
  const to = input.to && input.to < window.last ? input.to : window.last;
  if (from > to) return [];

  const candidates = await doctorsForService(input.serviceId);
  const doctorIds = input.doctorId ? candidates.filter((id) => id === input.doctorId) : candidates;
  const availability = await loadAvailability(doctorIds, from, to, db, input.excludeAppointmentId);

  return computeMergedSlots(availability, {
    durationMin: input.durationMin,
    stepMin: settings.stepMin,
    leadMin: input.ignoreLead ? 0 : settings.leadMin,
    horizonDays: input.ignoreLead ? Math.max(settings.horizonDays, 90) : settings.horizonDays,
    now,
    from,
    to,
  });
}

/** Ближайшие свободные слоты врача по любой из его услуг (для страницы врача). */
export async function nearestDoctorSlots(doctorId: string, durationMin: number, limit = 8, now = new Date()) {
  const settings = await getBookingSettings();
  const window = bookingWindow(now, settings.horizonDays);
  const out: MergedSlot[] = [];
  // Идём по неделям, чтобы не считать весь горизонт, если слоты есть уже завтра.
  for (let from = window.first; from <= window.last && out.length < limit; from = addDays(from, 7)) {
    const to = addDays(from, 6) < window.last ? addDays(from, 6) : window.last;
    const availability = await loadAvailability([doctorId], from, to);
    out.push(
      ...computeMergedSlots(availability, {
        durationMin,
        stepMin: settings.stepMin,
        leadMin: settings.leadMin,
        horizonDays: settings.horizonDays,
        now,
        from,
        to,
      }),
    );
  }
  return out.slice(0, limit);
}
