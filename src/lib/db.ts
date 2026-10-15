import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrl, withLibpqSsl } from "./pg-url";

function createClient() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL не задан (или подключите интеграцию Supabase в Vercel)");
  const adapter = new PrismaPg({
    connectionString: withLibpqSsl(url),
    // DATABASE_POOL_MAX=1 — для локального `prisma dev` (PGlite держит одно соединение); на Vercel не нужен.
    max: Number(process.env.DATABASE_POOL_MAX) || undefined,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
