import "server-only";
import { randomInt } from "node:crypto";
import { revalidateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import type { LocalizedText } from "@/config/clinic";
import { TAGS } from "../cache-tags";
import { db } from "../db";
import { asLocalized } from "../localized";
import { clientIp, rateLimit } from "../rate-limit";
import { cellStarts } from "../slots/cells";
import { isSlotAvailable, pickLeastLoadedDoctor } from "../slots/engine";
import { ACTIVE_STATUSES, doctorsForService, findSlots, getBookingSettings, loadAvailability } from "../slots/service";
import { addDays, toDateKey, zonedToUtc } from "../time";
import { adminBookingSchema, bookingSchema } from "../validators/booking";
import { isBlankPhone, normalizeKgPhone } from "../validators/phone";

export type BookingConfirmation = {
  code: string;
  start: string;
  end: string;
  serviceName: LocalizedText;
  doctorName: LocalizedText;
  doctorSlug: string;
  priceFrom: number;
  durationMin: number;
};

export type Alternative = { start: string; doctorIds: string[] };

export type BookingResult =
  | { ok: true; booking: BookingConfirmation }
  | { ok: false; error: "SLOT_TAKEN"; alternatives: Alternative[] }
  | { ok: false; error: "VALIDATION"; fieldErrors: Record<string, string> }
  | { ok: false; error: "RATE_LIMIT" | "NOT_FOUND" | "UNKNOWN" };

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode() {
  return Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

class SlotUnavailableError extends Error {}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

type Options = {
  source: "web" | "admin";
  /** Для записи из админки антиспам и rate limit не нужны. */
  trusted?: boolean;
  /** Статус новой записи (из админки можно сразу «подтверждена»). */
  status?: "NEW" | "CONFIRMED";
};

/**
 * Создание записи. Защита от двойного бронирования — в два слоя:
 * 1) в транзакции заново проверяем, что слот свободен по графику и существующим записям;
 * 2) вставляем строки BookedSlot с уникальным (doctorId, slotStart) — параллельная запись
 *    на пересекающееся время упадёт на уникальном ограничении БД (P2002).
 */
export async function createAppointment(raw: unknown, opts: Options): Promise<BookingResult> {
  // Из админки телефон необязателен; с сайта — обязателен.
  const parsed = (opts.trusted ? adminBookingSchema : bookingSchema).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "VALIDATION", fieldErrors };
  }
  const input = parsed.data;
  // Пустая строка — номера нет (только для записи из админки, см. adminBookingSchema).
  const phone = isBlankPhone(input.phone) ? "" : normalizeKgPhone(input.phone)!;
  const ip = opts.trusted ? undefined : await clientIp();

  if (!opts.trusted) {
    // Honeypot и «слишком быстрое» заполнение — тихо отклоняем, не подсказывая боту причину.
    if (input.website || Date.now() - input.startedAt < 3000) {
      console.warn("[booking] отклонено антиспамом", { ip });
      return { ok: false, error: "UNKNOWN" };
    }
    const [ipOk, phoneOk] = await Promise.all([
      rateLimit(`booking:ip:${ip}`, 5, 10 * 60_000),
      rateLimit(`booking:phone:${phone}`, 3, 24 * 3600_000),
    ]);
    if (!ipOk || !phoneOk) return { ok: false, error: "RATE_LIMIT" };
  }

  const service = await db.service.findFirst({ where: { id: input.serviceId, isActive: true } });
  if (!service) return { ok: false, error: "NOT_FOUND" };

  const candidates = await doctorsForService(service.id);
  const wanted = input.doctorId === "any" ? candidates : candidates.filter((id) => id === input.doctorId);
  if (wanted.length === 0) return { ok: false, error: "NOT_FOUND" };

  const start = new Date(input.start);
  const end = new Date(start.getTime() + service.durationMin * 60_000);
  const date = toDateKey(start);
  const settings = await getBookingSettings();

  // «Любой врач»: сначала тот, у кого меньше записей в этот день.
  let ordered = wanted;
  if (wanted.length > 1) {
    const dayStart = zonedToUtc(date, 0);
    const dayEnd = zonedToUtc(addDays(date, 1), 0);
    const loads = await db.appointment.groupBy({
      by: ["doctorId"],
      where: { doctorId: { in: wanted }, status: { in: [...ACTIVE_STATUSES] }, startAt: { gte: dayStart, lt: dayEnd } },
      _count: { _all: true },
    });
    const loadMap = new Map(loads.map((l) => [l.doctorId, l._count._all]));
    ordered = [];
    const pool = [...wanted];
    while (pool.length) {
      const next = pickLeastLoadedDoctor(pool, loadMap)!;
      ordered.push(next);
      pool.splice(pool.indexOf(next), 1);
    }
  }

  for (const doctorId of ordered) {
    try {
      const appointment = await db.$transaction(async (tx) => {
        const [availability] = await loadAvailability([doctorId], date, date, tx);
        const free = isSlotAvailable(availability, start, {
          durationMin: service.durationMin,
          stepMin: settings.stepMin,
          leadMin: opts.trusted ? 0 : settings.leadMin,
          horizonDays: opts.trusted ? Math.max(settings.horizonDays, 90) : settings.horizonDays,
          now: new Date(),
        });
        if (!free) throw new SlotUnavailableError();

        return tx.appointment.create({
          data: {
            publicCode: generateCode(),
            serviceId: service.id,
            doctorId,
            startAt: start,
            endAt: end,
            patientName: input.name,
            patientPhone: phone,
            comment: input.comment || null,
            status: opts.status ?? "NEW",
            source: opts.source,
            locale: input.locale,
            consentAt: new Date(),
            ip,
            bookedSlots: { create: cellStarts(start, end).map((slotStart) => ({ doctorId, slotStart })) },
          },
          include: { doctor: { select: { name: true, slug: true } } },
        });
      });

      revalidateTag(TAGS.schedule, "max");

      return {
        ok: true,
        booking: {
          code: appointment.publicCode,
          start: appointment.startAt.toISOString(),
          end: appointment.endAt.toISOString(),
          serviceName: asLocalized(service.name),
          doctorName: asLocalized(appointment.doctor.name),
          doctorSlug: appointment.doctor.slug,
          priceFrom: service.priceFrom,
          durationMin: service.durationMin,
        },
      };
    } catch (e) {
      if (e instanceof SlotUnavailableError || isUniqueViolation(e)) continue;
      console.error("[booking] ошибка создания записи", e);
      return { ok: false, error: "UNKNOWN" };
    }
  }

  // Слот заняли, пока клиент заполнял форму, — предлагаем ближайшие свободные окна.
  const slots = await findSlots({
    serviceId: service.id,
    durationMin: service.durationMin,
    doctorId: input.doctorId === "any" ? null : input.doctorId,
    from: date,
    to: addDays(date, 14),
    ignoreLead: opts.trusted,
  });
  return {
    ok: false,
    error: "SLOT_TAKEN",
    alternatives: slots.slice(0, 6).map((s) => ({ start: s.start.toISOString(), doctorIds: s.doctorIds })),
  };
}
