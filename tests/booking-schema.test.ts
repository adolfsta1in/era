import { describe, expect, it } from "vitest";
import { adminBookingSchema, bookingSchema } from "@/lib/validators/booking";

const base = {
  serviceId: "svc",
  doctorId: "any",
  start: "2026-10-20T04:00:00.000Z",
  name: "Айбек",
  consent: true as const,
  startedAt: 1,
};

describe("телефон в записи", () => {
  it("с сайта телефон обязателен", () => {
    expect(bookingSchema.safeParse({ ...base, phone: "" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...base, phone: "+996 (555) 12-34-56" }).success).toBe(true);
  });

  it("из админки телефон можно не указывать, но введённый номер проверяется", () => {
    expect(adminBookingSchema.safeParse({ ...base, phone: "" }).success).toBe(true);
    expect(adminBookingSchema.safeParse({ ...base, phone: "+996 (___) ___-___" }).success).toBe(true);
    expect(adminBookingSchema.safeParse({ ...base, phone: "+996 (555) 12" }).success).toBe(false);
    expect(adminBookingSchema.safeParse({ ...base, phone: "+996 (555) 12-34-56" }).success).toBe(true);
  });
});
