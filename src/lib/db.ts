import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { withLibpqSsl } from "./pg-url";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задан");
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
