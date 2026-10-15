import { cacheLife, cacheTag } from "next/cache";
import type { LocalizedText } from "@/config/clinic";
import { TAGS } from "./cache-tags";
import { db } from "./db";
import { asLocalized, asLocalizedList } from "./localized";

/*
 * Публичные данные сайта. Все функции кэшируются ("use cache") и сбрасываются
 * тегами из админки (updateTag), поэтому страницы остаются статическими и быстрыми.
 */

export type CategoryDTO = { id: string; slug: string; name: LocalizedText; sortOrder: number };

export type ServiceDTO = {
  id: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  name: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  durationMin: number;
  priceFrom: number;
  priceTo: number | null;
  isPopular: boolean;
  doctorIds: string[];
};

export type DoctorDTO = {
  id: string;
  slug: string;
  name: LocalizedText;
  specialty: LocalizedText;
  bio: LocalizedText;
  education: LocalizedText[];
  experienceSince: number;
  photoUrl: string | null;
  serviceIds: string[];
};

export type ReviewDTO = {
  id: string;
  authorName: string;
  text: LocalizedText;
  rating: number;
  serviceName: LocalizedText | null;
  isDemo: boolean;
};

export type FaqDTO = { id: string; question: LocalizedText; answer: LocalizedText };

export async function getCatalog(): Promise<{ categories: CategoryDTO[]; services: ServiceDTO[] }> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.services, TAGS.doctors);

  const [categories, services] = await Promise.all([
    db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }],
      include: {
        category: { select: { slug: true, sortOrder: true } },
        doctors: { where: { doctor: { isActive: true } }, select: { doctorId: true } },
      },
    }),
  ]);

  const usedCategories = new Set(services.map((s) => s.categoryId));

  return {
    categories: categories
      .filter((c) => usedCategories.has(c.id))
      .map((c) => ({ id: c.id, slug: c.slug, name: asLocalized(c.name), sortOrder: c.sortOrder })),
    services: services
      .sort((a, b) => a.category.sortOrder - b.category.sortOrder || a.sortOrder - b.sortOrder)
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        categoryId: s.categoryId,
        categorySlug: s.category.slug,
        name: asLocalized(s.name),
        shortDescription: asLocalized(s.shortDescription),
        description: asLocalized(s.description),
        durationMin: s.durationMin,
        priceFrom: s.priceFrom,
        priceTo: s.priceTo,
        isPopular: s.isPopular,
        doctorIds: s.doctors.map((d) => d.doctorId),
      })),
  };
}

export async function getDoctors(): Promise<DoctorDTO[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.doctors, TAGS.services);

  const doctors = await db.doctor.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { services: { where: { service: { isActive: true } }, select: { serviceId: true } } },
  });

  return doctors.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: asLocalized(d.name),
    specialty: asLocalized(d.specialty),
    bio: asLocalized(d.bio),
    education: asLocalizedList(d.education),
    experienceSince: d.experienceSince,
    photoUrl: d.photoUrl,
    serviceIds: d.services.map((s) => s.serviceId),
  }));
}

export async function getServiceBySlug(slug: string) {
  const { services, categories } = await getCatalog();
  const service = services.find((s) => s.slug === slug);
  if (!service) return null;
  return { service, category: categories.find((c) => c.id === service.categoryId)!, services };
}

export async function getDoctorBySlug(slug: string) {
  const doctors = await getDoctors();
  return doctors.find((d) => d.slug === slug) ?? null;
}

export async function getReviews(): Promise<ReviewDTO[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.content);

  const rows = await db.review.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    text: asLocalized(r.text),
    rating: r.rating,
    serviceName: r.serviceName ? asLocalized(r.serviceName) : null,
    isDemo: r.isDemo,
  }));
}

export async function getFaqs(): Promise<FaqDTO[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.content);

  const rows = await db.faq.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((f) => ({ id: f.id, question: asLocalized(f.question), answer: asLocalized(f.answer) }));
}

export type BeforeAfterDTO = { id: string; title: LocalizedText; description: LocalizedText; beforeUrl: string; afterUrl: string };

export async function getBeforeAfterCases(): Promise<BeforeAfterDTO[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.content);

  const rows = await db.beforeAfterCase.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((c) => ({
    id: c.id,
    title: asLocalized(c.title),
    description: asLocalized(c.description),
    beforeUrl: c.beforeUrl,
    afterUrl: c.afterUrl,
  }));
}
