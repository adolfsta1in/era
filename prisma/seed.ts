/**
 * Заполняет БД демо-данными: `npm run db:seed` (или `npm run db:reset` — пересоздать БД с нуля).
 * Внимание: удаляет все существующие данные!
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { clinicDefaults } from "../src/config/clinic";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseUrl, withLibpqSsl } from "../src/lib/pg-url";
import { cellStarts } from "../src/lib/slots/cells";
import { addDays, hhmmToMinutes, toDateKey, weekdayOf, zonedToUtc } from "../src/lib/time";
import { beforeAfterCases, categories, doctors, faqs, reviews, services } from "./seed-data";

const url = databaseUrl()!;
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: withLibpqSsl(url), max: Number(process.env.DATABASE_POOL_MAX) || undefined }),
});

const PATIENTS = [
  ["Азамат Осмонов", "+996555100201"],
  ["Мария Ли", "+996700300402"],
  ["Чолпон Абдыкадырова", "+996777500603"],
  ["Руслан Сыдыков", "+996550700804"],
  ["Анна Петренко", "+996705900105"],
  ["Бекзат Иманалиев", "+996772110206"],
  ["Динара Мамытова", "+996553220307"],
  ["Игорь Ким", "+996709330408"],
  ["Айпери Жээнбекова", "+996770440509"],
  ["Санжар Турдубаев", "+996556550610"],
  ["Елизавета Орлова", "+996701660711"],
  ["Талант Бейшеев", "+996775770812"],
] as const;

function code(i: number) {
  return `DEMO${String(1000 + i * 37).slice(-4)}`;
}

async function main() {
  // SEED_IF_EMPTY=1 — режим для деплоя (npm run vercel-build): заливаем данные только в пустую базу,
  // чтобы повторные деплои не стирали реальные записи пациентов.
  if (process.env.SEED_IF_EMPTY === "1" && (await db.clinicSettings.count()) > 0) {
    console.log("База уже заполнена — seed пропущен");
    return;
  }
  console.log("Очищаю БД…");
  await db.bookedSlot.deleteMany();
  await db.appointment.deleteMany();
  await db.scheduleException.deleteMany();
  await db.scheduleRule.deleteMany();
  await db.doctorService.deleteMany();
  await db.doctor.deleteMany();
  await db.service.deleteMany();
  await db.serviceCategory.deleteMany();
  await db.review.deleteMany();
  await db.faq.deleteMany();
  await db.beforeAfterCase.deleteMany();
  await db.rateLimitHit.deleteMany();
  await db.clinicSettings.deleteMany();

  console.log("Настройки клиники…");
  await db.clinicSettings.create({ data: { id: 1, ...clinicDefaults } });

  console.log("Категории и услуги…");
  const categoryIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const row = await db.serviceCategory.create({ data: { slug: c.slug, name: c.name, sortOrder: i } });
    categoryIds.set(c.slug, row.id);
  }
  const serviceIds = new Map<string, { id: string; durationMin: number }>();
  for (const [i, s] of services.entries()) {
    const row = await db.service.create({
      data: {
        slug: s.slug,
        categoryId: categoryIds.get(s.category)!,
        name: s.name,
        shortDescription: s.short,
        description: s.description,
        durationMin: s.durationMin,
        priceFrom: s.priceFrom,
        priceTo: s.priceTo ?? null,
        currency: s.currency ?? "KGS",
        isPopular: s.popular ?? false,
        sortOrder: i,
      },
    });
    serviceIds.set(s.slug, { id: row.id, durationMin: row.durationMin });
  }

  console.log("Врачи и графики…");
  const today = toDateKey(new Date());
  const doctorIds = new Map<string, string>();
  for (const [i, d] of doctors.entries()) {
    const row = await db.doctor.create({
      data: {
        slug: d.slug,
        name: d.name,
        specialty: d.specialty,
        bio: d.bio,
        education: d.education,
        experienceSince: d.experienceSince,
        photoUrl: d.photoUrl ?? null,
        sortOrder: i,
        services: { create: d.services.map((slug) => ({ serviceId: serviceIds.get(slug)!.id })) },
        scheduleRules: {
          create: Object.entries(d.schedule).map(([weekday, hours]) => {
            const [start, end, bStart, bEnd] = hours!;
            return {
              weekday: Number(weekday),
              startMin: hhmmToMinutes(start),
              endMin: hhmmToMinutes(end),
              breakStartMin: bStart ? hhmmToMinutes(bStart) : null,
              breakEndMin: bEnd ? hhmmToMinutes(bEnd) : null,
            };
          }),
        },
      },
    });
    doctorIds.set(d.slug, row.id);
  }

  // Демо-исключения и демо-записи нужны только для показа шаблона.
  // Для реальной клиники: SEED_DEMO=false npm run db:seed — или они сами пропустятся, если врачей с такими slug нет.
  const demo = process.env.SEED_DEMO !== "false";

  // Исключения: отпуск ортодонта на 5 дней через неделю и особые часы хирурга.
  const kim = doctorIds.get("kim-elena");
  if (demo && kim) {
    for (let i = 7; i < 12; i++) {
      await db.scheduleException.create({
        data: { doctorId: kim, date: addDays(today, i), type: "DAY_OFF", note: "Отпуск" },
      });
    }
  }
  const surgeon = doctors.find((d) => d.slug === "aliev-timur");
  if (demo && surgeon && Object.keys(surgeon.schedule).length > 0) {
    let surgeonDay = addDays(today, 2);
    while (!surgeon.schedule[weekdayOf(surgeonDay)]) surgeonDay = addDays(surgeonDay, 1);
    await db.scheduleException.create({
      data: {
        doctorId: doctorIds.get(surgeon.slug)!,
        date: surgeonDay,
        type: "CUSTOM_HOURS",
        startMin: hhmmToMinutes("14:00"),
        endMin: hhmmToMinutes("19:00"),
        note: "Утром — конференция",
      },
    });
  }

  console.log(demo ? "Демо-записи…" : "Демо-записи пропущены (SEED_DEMO=false)");
  // [врач, смещение дня, время, услуга, статус]
  const plan: [string, number, string, string, string][] = [
    ["sokolova-darya", -3, "10:00", "professionalnaya-chistka", "COMPLETED"],
    ["asanova-aygerim", -2, "11:00", "lechenie-kariesa", "COMPLETED"],
    ["aliev-timur", -2, "16:00", "udalenie-zuba", "NO_SHOW"],
    ["zhumabekov-nurlan", -1, "12:30", "otbelivanie-zoom", "COMPLETED"],
    ["asanova-aygerim", 0, "15:00", "lechenie-kanalov", "CONFIRMED"],
    ["sokolova-darya", 0, "16:00", "professionalnaya-chistka", "NEW"],
    ["toktosunova-bermet", 1, "10:00", "pervyy-vizit-rebenka", "CONFIRMED"],
    ["asanova-aygerim", 1, "09:00", "konsultaciya-stomatologa", "NEW"],
    ["aliev-timur", 1, "11:00", "implantaciya-zuba", "CONFIRMED"],
    ["zhumabekov-nurlan", 2, "17:00", "keramicheskie-viniry", "NEW"],
    ["kim-elena", 2, "10:00", "konsultaciya-ortodonta", "NEW"],
    ["sokolova-darya", 3, "13:30", "otbelivanie-zoom", "CANCELLED"],
  ];

  for (const [i, [doctorSlug, offset, time, serviceSlug, status]] of (demo ? plan : []).entries()) {
    const doctor = doctors.find((d) => d.slug === doctorSlug);
    if (!doctor || !serviceIds.has(serviceSlug) || Object.keys(doctor.schedule).length === 0) continue;
    // Сдвигаем на ближайший рабочий день врача.
    let date = addDays(today, offset);
    while (!doctor.schedule[weekdayOf(date)]) date = addDays(date, offset < 0 ? -1 : 1);
    const service = serviceIds.get(serviceSlug)!;
    const startAt = zonedToUtc(date, hhmmToMinutes(time));
    const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);
    const doctorId = doctorIds.get(doctorSlug)!;
    const [patientName, patientPhone] = PATIENTS[i % PATIENTS.length];
    const occupies = status !== "CANCELLED" && status !== "NO_SHOW";

    // Если демо-записи пересеклись (например, сдвиг на тот же день) — просто пропускаем.
    const cells = cellStarts(startAt, endAt);
    if (occupies) {
      const clash = await db.bookedSlot.findFirst({ where: { doctorId, slotStart: { in: cells } } });
      if (clash) continue;
    }

    await db.appointment.create({
      data: {
        publicCode: code(i),
        serviceId: service.id,
        doctorId,
        startAt,
        endAt,
        patientName,
        patientPhone,
        status,
        source: i % 3 === 0 ? "admin" : "web",
        consentAt: new Date(),
        comment: i === 5 ? "Чувствительные зубы, просьба использовать гель" : null,
        bookedSlots: occupies ? { create: cells.map((slotStart) => ({ doctorId, slotStart })) } : undefined,
      },
    });
  }

  console.log("Отзывы и FAQ…");
  for (const [i, r] of reviews.entries()) {
    await db.review.create({
      data: {
        authorName: r.author,
        text: r.text,
        rating: r.rating,
        serviceName: r.service,
        sortOrder: i,
        isDemo: r.isDemo ?? true,
      },
    });
  }
  for (const [i, f] of faqs.entries()) {
    await db.faq.create({ data: { question: f.q, answer: f.a, sortOrder: i } });
  }

  for (const [i, c] of beforeAfterCases.entries()) {
    await db.beforeAfterCase.create({ data: { ...c, sortOrder: i } });
  }
  console.log("Готово ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
