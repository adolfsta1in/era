/**
 * Начальные настройки клиники.
 *
 * Эти значения seed-скрипт записывает в таблицу ClinicSettings. После этого
 * всё редактируется в админке: «Настройки». Если нужно перенастроить шаблон под
 * новую клинику до первого запуска, достаточно поменять значения здесь и
 * выполнить `npm run db:reset`.
 */
import type { ThemeId } from "./themes";

export type LocalizedText = { ru: string; ky: string };

/** Часы работы по дням недели: 0 — воскресенье … 6 — суббота. null — выходной. */
export type WorkingHours = Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", { open: string; close: string } | null>;

export type ClinicConfig = {
  name: string;
  shortName: string;
  tagline: LocalizedText;
  description: LocalizedText;
  about: LocalizedText;
  logoUrl: string | null;
  phones: string[];
  whatsapp: string;
  telegram: string;
  instagram: string;
  email: string;
  address: LocalizedText;
  addressNote: LocalizedText;
  lat: number;
  lng: number;
  twoGisUrl: string;
  /** Ссылка (src) iframe-виджета карты из конструктора 2GIS. Пусто — показывается стилизованная карта с кнопкой маршрута. */
  mapEmbedUrl: string;
  workingHours: WorkingHours;
  theme: ThemeId;
  foundedYear: number;
  patientsCount: number;
  rating: number;
  /** Минимум минут от текущего момента до записи. */
  bookingLeadMinutes: number;
  /** На сколько дней вперёд открыта запись. */
  bookingHorizonDays: number;
  /** Шаг сетки слотов в минутах. */
  slotStepMinutes: number;
  /** Юридическое лицо и ИНН для политики конфиденциальности. */
  legalName: string;
  legalInn: string;
};

export const clinicDefaults: ClinicConfig = {
  name: "ERA Premium Dental Clinic",
  shortName: "ERA",
  tagline: {
    ru: "Эстетика, результат, абсолютное качество",
    ky: "Эстетика, натыйжа, мыкты сапат",
  },
  description: {
    ru: "ERA Premium Dental Clinic в 7 микрорайоне Бишкека: диагностика и 3D КТ, лечение и реставрация зубов, имплантация, протезирование и эстетика. Онлайн-запись к врачу за минуту.",
    ky: "Бишкектин 7-кичи районундагы ERA Premium Dental Clinic: диагностика жана 3D КТ, тиштерди дарылоо жана реставрация, имплантация, протездөө жана эстетика. Дарыгерге бир мүнөттө онлайн жазылыңыз.",
  },
  about: {
    ru: "ERA — стоматология в 7 микрорайоне Бишкека, открылась в марте 2026 года. Пациентов принимает Ильёр Арипахунов — стоматолог общей практики, хирург-имплантолог и ортопед. Поэтому лечение, удаление, имплант и коронку на нём можно сделать в одних руках, без пересылок между клиниками. Перед лечением врач всё объясняет и называет стоимость, а работает аккуратно и без боли — об этом чаще всего пишут пациенты в отзывах.",
    ky: "ERA — Бишкектин 7-кичи районундагы стоматология, 2026-жылдын мартында ачылган. Бейтаптарды Ильёр Арипахунов кабыл алат — жалпы практикадагы стоматолог, хирург-имплантолог жана ортопед. Ошондуктан дарылоо, жулуу, имплант жана анын үстүндөгү коронканы бир эле дарыгерден жасатсаңыз болот, клиникадан клиникага жүгүрбөйсүз. Дарылоодон мурун дарыгер баарын түшүндүрүп, баасын айтат, ал эми тыкан жана оорутпай иштейт — бейтаптар пикирлеринде көбүнчө ушуну жазышат.",
  },
  logoUrl: "/brand/logo.png",
  phones: ["+996 557 668 885"],
  whatsapp: "996557668885",
  telegram: "+996557668885",
  instagram: "dr.aripakhunov",
  email: "",
  address: {
    ru: "г. Бишкек, 7-й микрорайон, 28",
    ky: "Бишкек ш., 7-кичи район, 28",
  },
  addressNote: {
    ru: "1 этаж, вход с улицы — над дверью вывеска ERA. Рядом БГУ им. К. Карасаева.",
    ky: "1-кабат, кире бериш көчө тараптан — эшиктин үстүндө ERA жазуусу. Жанында К. Карасаев атындагы БГУ.",
  },
  lat: 42.829781,
  lng: 74.615459,
  twoGisUrl: "https://2gis.kg/bishkek/firm/70000001111803979",
  mapEmbedUrl: "",
  workingHours: {
    "0": null,
    "1": { open: "08:00", close: "18:00" },
    "2": { open: "08:00", close: "18:00" },
    "3": { open: "08:00", close: "18:00" },
    "4": { open: "08:00", close: "18:00" },
    "5": { open: "08:00", close: "18:00" },
    "6": { open: "08:00", close: "18:00" },
  },
  theme: "blue",
  // Открылась 8 марта 2026 (пост в Instagram). Пока клинике меньше года, блок «лет работаем» не показываем — 0.
  // 0 — блок «лет работаем» / «пациентов» на сайте скрывается.
  foundedYear: 0,
  patientsCount: 0,
  rating: 4.7,
  bookingLeadMinutes: 120,
  bookingHorizonDays: 30,
  slotStepMinutes: 15,
  // Юрлицо и ИНН не найдены в открытых источниках — уточнить у клиники.
  legalName: "ERA Premium Dental Clinic",
  legalInn: "",
};
