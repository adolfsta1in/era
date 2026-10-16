import { EyeOff, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/admin/page-title";
import { CategoryManager } from "@/components/admin/services/category-manager";
import { ServiceSort } from "@/components/admin/services/service-sort";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { adminPrice } from "@/lib/i18n-format";
import { asLocalized, tr } from "@/lib/localized";

export const metadata: Metadata = { title: "Услуги и цены" };

export default async function ServicesAdminPage() {
  const categories = await db.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { services: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { doctors: true } } } } },
  });

  return (
    <>
      <PageTitle
        title="Услуги и цены"
        description="Цены указываются «от» — так их видят пациенты на сайте."
        actions={
          <Button asChild>
            <Link href="/admin/services/new">
              <Plus /> Добавить услугу
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {categories.map((c) => (
            <section key={c.id} aria-labelledby={`c-${c.id}`}>
              <h2 id={`c-${c.id}`} className="mb-2 px-1 text-lg font-bold">
                {tr(c.name, "ru")}
              </h2>
              {c.services.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">В категории пока нет услуг</p>
              ) : (
                <ul className="divide-y rounded-2xl border bg-card">
                  {c.services.map((s, i) => {
                    const name = tr(s.name, "ru");
                    return (
                      <li key={s.id} className="flex items-center gap-2 py-2 pr-3 pl-1 sm:gap-3">
                        <ServiceSort id={s.id} first={i === 0} last={i === c.services.length - 1} label={name} />
                        <Link href={`/admin/services/${s.id}`} className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-ink">{name}</span>
                            {s.isPopular && <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Популярная" />}
                            {!s.isActive && <EyeOff className="size-3.5 shrink-0 text-muted-foreground" aria-label="Скрыта" />}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {s.durationMin} мин · врачей: {s._count.doctors}
                            {!asLocalized(s.name).ky && " · нет перевода KG"}
                          </span>
                        </Link>
                        <span className="text-right text-sm font-semibold whitespace-nowrap text-ink">
                          {adminPrice(s.priceFrom, s.currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
        <div>
          <CategoryManager
            categories={categories.map((c) => ({ id: c.id, name: asLocalized(c.name), count: c.services.length }))}
          />
        </div>
      </div>
    </>
  );
}
