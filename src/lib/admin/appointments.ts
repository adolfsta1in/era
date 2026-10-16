import "server-only";
import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { isStatus, type AppointmentStatus } from "../appointment-status";
import { db } from "../db";
import { addDays, isDateKey, toDateKey, zonedToUtc, type DateKey } from "../time";

export type AppointmentFilters = {
  from?: DateKey;
  to?: DateKey;
  doctor?: string;
  status?: AppointmentStatus;
  q?: string;
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): AppointmentFilters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const from = get("from");
  const to = get("to");
  const status = get("status");
  return {
    from: from && isDateKey(from) ? from : undefined,
    to: to && isDateKey(to) ? to : undefined,
    doctor: get("doctor") || undefined,
    status: isStatus(status) ? status : undefined,
    q: get("q")?.trim() || undefined,
  };
}

export function filtersToWhere(f: AppointmentFilters): Prisma.AppointmentWhereInput {
  const where: Prisma.AppointmentWhereInput = {};
  if (f.from || f.to) {
    where.startAt = {
      ...(f.from ? { gte: zonedToUtc(f.from, 0) } : {}),
      ...(f.to ? { lt: zonedToUtc(addDays(f.to, 1), 0) } : {}),
    };
  }
  if (f.doctor) where.doctorId = f.doctor;
  if (f.status) where.status = f.status;
  if (f.q) {
    const digits = f.q.replace(/\D/g, "");
    where.OR = [
      { patientName: { contains: f.q } },
      ...(digits.length >= 3 ? [{ patientPhone: { contains: digits } }] : []),
      { publicCode: { contains: f.q.toUpperCase() } },
    ];
  }
  return where;
}

export const appointmentInclude = {
  service: { select: { id: true, name: true, durationMin: true, priceFrom: true, currency: true } },
  doctor: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.AppointmentInclude;

export type AdminAppointment = Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;

export async function listAppointments(f: AppointmentFilters, take = 300) {
  return db.appointment.findMany({
    where: filtersToWhere(f),
    include: appointmentInclude,
    orderBy: { startAt: "asc" },
    take,
  });
}

export async function appointmentsForRange(from: DateKey, to: DateKey, doctorId?: string) {
  return db.appointment.findMany({
    where: {
      startAt: { gte: zonedToUtc(from, 0), lt: zonedToUtc(addDays(to, 1), 0) },
      ...(doctorId ? { doctorId } : {}),
    },
    include: appointmentInclude,
    orderBy: { startAt: "asc" },
  });
}

/** «Сегодня» по времени клиники. connection() — страница админки всегда рендерится по запросу. */
export async function todayKey() {
  await connection();
  return toDateKey(new Date());
}
