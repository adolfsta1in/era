import { z } from "zod";
import { isBlankPhone, normalizeKgPhone } from "./phone";

/**
 * Схема формы контактов в мастере записи. Сообщения об ошибках — ключи
 * переводов из booking.validation.*, чтобы одна схема работала и на клиенте, и на сервере.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(80, "nameTooLong"),
  phone: z.string().refine((v) => normalizeKgPhone(v) !== null, "phoneInvalid"),
  comment: z.string().trim().max(500, "commentTooLong").optional().default(""),
  consent: z.literal(true, { error: "consentRequired" }),
});

export type ContactValues = z.input<typeof contactSchema>;

export const bookingSchema = contactSchema.extend({
  serviceId: z.string().min(1),
  /** id врача или "any" */
  doctorId: z.string().min(1),
  start: z.iso.datetime(),
  locale: z.enum(["ru", "ky"]).default("ru"),
  // Антиспам: скрытое поле должно остаться пустым, форма — заполняться не быстрее 3 секунд.
  website: z.string().max(500).optional().default(""),
  startedAt: z.number().int().positive(),
});

export type BookingInput = z.input<typeof bookingSchema>;

/** Запись из админки: телефон можно не указывать (пациент пришёл без номера, записали по звонку и т.п.). */
export const adminBookingSchema = bookingSchema.extend({
  phone: z.string().refine((v) => isBlankPhone(v) || normalizeKgPhone(v) !== null, "phoneInvalid"),
});
