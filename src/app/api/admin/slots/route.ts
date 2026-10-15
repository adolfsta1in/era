import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth/session";
import { dateParam, resolveServiceAndDoctor } from "@/lib/booking/query";
import { findSlots } from "@/lib/slots/service";

/**
 * Слоты для записи из админки: без минимального отступа, горизонт до 90 дней.
 * exclude=<id записи> — для переноса: время самой записи считается свободным.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const date = dateParam(params, "date");
  const resolved = await resolveServiceAndDoctor(params);
  if (!resolved || !date) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const slots = await findSlots({
    serviceId: resolved.service.id,
    durationMin: resolved.service.durationMin,
    doctorId: resolved.doctorId,
    from: date,
    to: date,
    ignoreLead: true,
    excludeAppointmentId: params.get("exclude") ?? undefined,
  });
  return NextResponse.json(
    { slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString(), doctorIds: s.doctorIds })) },
    { headers: { "cache-control": "no-store" } },
  );
}
