/**
 * Строка подключения для сайта. DATABASE_URL — если задана вручную; иначе — переменные, которые
 * прописывает интеграция Supabase ↔ Vercel (POSTGRES_PRISMA_URL — transaction pooler).
 */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;
}

/**
 * В pg 8.x `sslmode=require` означает полную проверку сертификата, а пулер Supabase отдаёт сертификат
 * своего CA — подключение падает. Режим libpq (как у psql): `require` = шифрование без проверки CA.
 * Для хостов Supabase без sslmode шифрование включаем сами. Только для драйвера pg; строку для миграций
 * (prisma.config.ts) читает движок Prisma — её не трогаем.
 */
export function withLibpqSsl(url: string): string {
  if (/[?&]uselibpqcompat=/.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  if (/[?&]sslmode=require\b/.test(url)) return `${url}${sep}uselibpqcompat=true`;
  if (/[?&]sslmode=/.test(url) || !/\.supabase\.(com|co)\b/.test(url)) return url;
  return `${url}${sep}sslmode=require&uselibpqcompat=true`;
}
