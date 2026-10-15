/**
 * В pg 8.x `sslmode=require` означает полную проверку сертификата, а пулер Supabase отдаёт сертификат
 * своего CA — подключение падает. Режим libpq (как у psql): `require` = шифрование без проверки CA.
 * Только для драйвера pg; строку для миграций (prisma.config.ts) читает движок Prisma — её не трогаем.
 */
export function withLibpqSsl(url: string): string {
  if (!/[?&]sslmode=require\b/.test(url) || /[?&]uselibpqcompat=/.test(url)) return url;
  return `${url}&uselibpqcompat=true`;
}
