import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { WorksEditor } from "@/components/admin/works/works-editor";
import { db } from "@/lib/db";
import { asLocalized } from "@/lib/localized";

export const metadata: Metadata = { title: "До и после" };

export default async function WorksPage() {
  const works = await db.beforeAfterCase.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageTitle
        title="До и после"
        description="Работы в блоке «До и после» на главной. Загрузите два фото и коротко опишите работу — на сайте появится сразу."
      />
      <WorksEditor
        works={works.map((w) => ({
          id: w.id,
          title: asLocalized(w.title),
          description: asLocalized(w.description),
          beforeUrl: w.beforeUrl,
          afterUrl: w.afterUrl,
          isPublished: w.isPublished,
        }))}
      />
    </>
  );
}
