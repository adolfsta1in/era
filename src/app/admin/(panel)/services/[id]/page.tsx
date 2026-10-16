import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteServiceButton } from "@/components/admin/services/delete-service";
import { ServiceForm } from "@/components/admin/services/service-form";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { asLocalized, tr } from "@/lib/localized";

export const metadata: Metadata = { title: "Услуга" };

export default async function ServiceEditPage({ params }: PageProps<"/admin/services/[id]">) {
  const { id } = await params;
  const [service, categories, doctors] = await Promise.all([
    db.service.findUnique({ where: { id }, include: { doctors: true } }),
    db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.doctor.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!service) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/services" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> Все услуги
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{tr(service.name, "ru")}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/uslugi/${service.slug}`} target="_blank">
              <ExternalLink /> На сайте
            </a>
          </Button>
          <DeleteServiceButton id={service.id} />
        </div>
      </div>
      <ServiceForm
        categories={categories.map((c) => ({ id: c.id, name: tr(c.name, "ru") }))}
        doctors={doctors.map((d) => ({ id: d.id, name: tr(d.name, "ru") }))}
        service={{
          id: service.id,
          slug: service.slug,
          categoryId: service.categoryId,
          name: asLocalized(service.name),
          shortDescription: asLocalized(service.shortDescription),
          description: asLocalized(service.description),
          durationMin: service.durationMin,
          priceFrom: service.priceFrom,
          priceTo: service.priceTo,
          currency: service.currency,
          isPopular: service.isPopular,
          isActive: service.isActive,
          doctorIds: service.doctors.map((d) => d.doctorId),
        }}
      />
    </div>
  );
}
