# Деплой ERA на Vercel

Записи, врачи, услуги, отзывы и «До и после» хранятся в **PostgreSQL на Neon** (бесплатный тариф,
подключается к Vercel в один клик). Фото, загруженные в админке, — в **Vercel Blob**.
Supabase больше не нужен.

## 1. Проект в Vercel

1. https://vercel.com/new → Import репозитория `adolfsta1in/era`. Framework определится сам (Next.js),
   регион функций задан в `vercel.json` — `fra1` (Франкфурт, ближе всего к Бишкеку).
2. Пока не жмите Deploy — сначала база (шаг 2), иначе первая сборка упадёт без `DATABASE_URL`.

## 2. База: Neon

1. В проекте Vercel: **Storage → Create Database → Neon** (Serverless Postgres), регион
   **Europe Central (Frankfurt)**, план Free.
2. Подключить к проекту для Production / Preview / Development. Vercel сам добавит переменные
   `DATABASE_URL` (через пул) и `DATABASE_URL_UNPOOLED` (прямое — для миграций).

Что происходит при каждом деплое (`npm run vercel-build`):
- `prisma migrate deploy` — применяет новые миграции из `prisma/migrations`;
- seed с `SEED_IF_EMPTY=1` — заливает данные клиники **только в пустую базу** (первый деплой).
  Повторные деплои данные не трогают;
- `next build`.

## 3. Фото: Vercel Blob

**Storage → Create → Blob** → подключить к проекту. Появится `BLOB_READ_WRITE_TOKEN` — без него
загрузка фото врачей, логотипа и «До и после» в админке на Vercel работать не будет
(файловая система там только для чтения).

## 4. Остальные переменные (Settings → Environment Variables)

| Переменная | Значение |
| --- | --- |
| `SITE_URL` | адрес сайта без слэша, например `https://era.vercel.app` или свой домен |
| `ADMIN_PASSWORD` | пароль админки — **сложный**, не `admin123` |
| `SESSION_SECRET` | случайная строка от 32 символов: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | по желанию — уведомления о записях (см. README) |

`DATABASE_POOL_MAX` на Vercel **не задавать** — он только для локальной разработки.

Дальше — Deploy. После деплоя проверить: главная, `/booking` (тестовая запись), `/admin`.

## Локальная разработка

```bash
npx prisma dev -n era -d        # локальный Postgres, выведет строку postgres://…
# вставить её в .env → DATABASE_URL, плюс DATABASE_POOL_MAX="1"
npx prisma migrate dev
SEED_DEMO=false npm run db:seed # ⚠ стирает всё в этой базе
npm run dev
```

Можно вместо `prisma dev` использовать отдельную ветку Neon для разработки. **Не запускайте
`npm run db:seed` с продовым `DATABASE_URL`** — он удалит все записи пациентов.

## Альтернативы Neon

- **Prisma Postgres** (тоже есть в Vercel Storage, бесплатный тариф) — подключается так же, код менять не нужно.
- **Свой VPS с PostgreSQL** — если нужен полный контроль; строку подключения кладёте в `DATABASE_URL`.

Важно: тариф Vercel **Hobby** официально только для некоммерческих проектов. Для сайта клиники
правильнее тариф **Pro** (или другой хостинг для Next.js).
