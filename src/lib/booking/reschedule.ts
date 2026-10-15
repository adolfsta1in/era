import "server-only";
import { revalidateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { OCCUPYING } from "../appointment-status";
import { TAGS } from "../cache-tags";
import { db } from "../db";
import { cellStarts } from "../slots/cells";
import { isSlotAvailable } from "../slots/engine";
import { doctorsForService, getBookingSettings, loadAvailability } from "../slots/service";
import { toDateKey } from "../time";

export type RescheduleResult =
  | { ok: true; start: string; end: string }
  | { ok: false; error: "NOT_FOUND" | "NOT_ACTIVE" | "DOCTOR" | "SLOT_TAKEN" | "INVALID" };

class SlotUnavailableError extends Error {}

/**
 * Перенос записи на другое время (и, при желании, к другому врачу той же услуги) — из админки.
 * Защита от двойной записи та же, что при создании (src/lib/booking/create.ts):
 * в одной транзакции освобождаем старые ячейки BookedSlot, проверяем новое время по графику
 * и чужим записям и занимаем новые ячейки — пересечение упадёт на уникальном (doctorId, slotStart).
 */
export async function rescheduleAppointment(input: { id: string; start: string; doctorId?: string }): Promise<RescheduleResult> {
  const start = new Date(input.start);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "INVALID" };

  const appointment = await db.appointment.findUnique({ where: { id: input.id }, include: { service: true } });
  if (!appointment) return { ok: false, error: "NOT_FOUND" };
  // Завершённые, отменённые и «не пришёл» не переносим — их можно вернуть в работу сменой статуса.
  if (appointment.status !== "NEW" && appointment.status !== "CONFIRMED") return { ok: false, error: "NOT_ACTIVE" };

  const doctorId = input.doctorId || appointment.doctorId;
  if (doctorId !== appointment.doctorId) {
    const allowed = await doctorsForService(appointment.serviceId);
    if (!allowed.includes(doctorId)) return { ok: false, error: "DOCTOR" };
  }

  const end = new Date(start.getTime() + appointment.service.durationMin * 60_000);
  const date = toDateKey(start);
  const settings = await getBookingSettings();

  try {
    await db.$transaction(async (tx) => {
      await tx.bookedSlot.deleteMany({ where: { appointmentId: appointment.id } });
      const [availability] = await loadAvailability([doctorId], date, date, tx, appointment.id);
      const free = isSlotAvailable(availability, start, {
        durationMin: appointment.service.durationMin,
        stepMin: settings.stepMin,
        leadMin: 0,
        horizonDays: Math.max(settings.horizonDays, 90),
        now: new Date(),
      });
      if (!free) throw new SlotUnavailableError();

      await tx.appointment.update({ where: { id: appointment.id }, data: { doctorId, startAt: start, endAt: end } });
      if ((OCCUPYING as string[]).includes(appointment.status)) {
        await tx.bookedSlot.createMany({
          data: cellStarts(start, end).map((slotStart) => ({ appointmentId: appointment.id, doctorId, slotStart })),
        });
      }
    });
  } catch (e) {
    if (e instanceof SlotUnavailableError) return { ok: false, error: "SLOT_TAKEN" };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: false, error: "SLOT_TAKEN" };
    throw e;
  }

  revalidateTag(TAGS.schedule, "max");
  return { ok: true, start: start.toISOString(), end: end.toISOString() };
}
