import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Миграции — через session pooler Supabase (DATABASE_URL_UNPOOLED), сайт — через transaction pooler (DATABASE_URL).
    // POSTGRES_URL_NON_POOLING / POSTGRES_PRISMA_URL — те же строки от интеграции Supabase ↔ Vercel.
    url:
      process.env["DATABASE_URL_UNPOOLED"] ??
      process.env["POSTGRES_URL_NON_POOLING"] ??
      process.env["DATABASE_URL"] ??
      process.env["POSTGRES_PRISMA_URL"],
  },
});
