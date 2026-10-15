# Деплой ERA на Vercel

Данные (записи, врачи, услуги, отзывы, «До и после») хранятся в **Supabase**, проект **MySkin**
(`njttayqtrvbtdbawfenh`, регион Seoul `ap-northeast-2`). ⚠ Не путать с **MySkin EU** — он для другого.

Схема и данные клиники в MySkin уже залиты (15.10.2026): настройки, 31 услуга, врач, отзывы, FAQ,
3 работы «До и после». Миграция `20261015120613_init` отмечена применённой, поэтому
`prisma migrate deploy` на Vercel её пропустит. На всех таблицах включён RLS без политик — публичный
REST API Supabase к ним доступа не имеет; сайт ходит в базу напрямую через Prisma.

Фото, загруженные в админке (врачи, логотип, «До и после»), — в **Vercel Blob**.

## 1. Подключить базу к Vercel

**Проще всего — интеграция (пароль копировать не нужно):** Supabase → проект **MySkin** →
Project Settings → **Integrations → Vercel** → Connect → выбрать Vercel-проект **era**. Интеграция сама
пропишет в Vercel `POSTGRES_PRISMA_URL` (для сайта) и `POSTGRES_URL_NON_POOLING` (для миграций) —
код их понимает. После этого — Redeploy.

**Или вручную** — строки подключения:


Supabase → проект **MySkin** → кнопка **Connect** (вверху) → вкладка **ORMs → Prisma** или **Connection string**.
Нужны две строки с паролем базы (Database password; если забыли — Project Settings → Database → Reset password):

| Переменная в Vercel | Какая строка | Пример |
| --- | --- | --- |
| `DATABASE_URL` | **Transaction pooler**, порт **6543** — для сайта | `postgresql://postgres.njttayqtrvbtdbawfenh:ПАРОЛЬ@aws-…-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require` |
| `DATABASE_URL_UNPOOLED` | **Session pooler**, порт **5432** — для миграций | `postgresql://postgres.njttayqtrvbtdbawfenh:ПАРОЛЬ@aws-…-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require` |

Хост пулера (`aws-0-…` или `aws-1-…`) копируйте из Supabase как есть. Прямое подключение
`db.njttayqtrvbtdbawfenh.supabase.co` не подходит: оно только по IPv6, а Vercel ходит по IPv4.

## 2. Проект в Vercel

1. https://vercel.com/new → Import `adolfsta1in/era`. Регион функций — `icn1` (Сеул, рядом с базой), задан в `vercel.json`.
2. **Storage → Create → Blob** → подключить к проекту (появится `BLOB_READ_WRITE_TOKEN`).
3. **Settings → Environment Variables**:

| Переменная | Значение |
| --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | из шага 1 |
| `SITE_URL` | адрес сайта без слэша, например `https://era.vercel.app` |
| `ADMIN_PASSWORD` | пароль админки — **сложный**, не `admin123` |
| `SESSION_SECRET` | случайная строка: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

`DATABASE_POOL_MAX` на Vercel **не задавать** — он только для локальной разработки.

4. Deploy. Сборка (`npm run vercel-build`): `prisma migrate deploy` → seed только если база пустая
(в MySkin уже есть данные — пропустится) → `next build`.

Проверить после деплоя: главная, `/booking` (тестовая запись → видна в `/admin`), загрузка фото в «До и после».

## Локальная разработка

```bash
npx prisma dev -n era -d        # локальный Postgres, выведет строку postgres://…
# вставить её в .env → DATABASE_URL, плюс DATABASE_POOL_MAX="1"
npx prisma migrate dev
SEED_DEMO=false npm run db:seed # ⚠ стирает всё в этой базе
npm run dev
```

**Никогда не запускайте `npm run db:seed` со строкой Supabase** — он удалит все записи пациентов.

Тариф Vercel **Hobby** официально только для некоммерческих проектов; для сайта клиники правильнее **Pro**.
