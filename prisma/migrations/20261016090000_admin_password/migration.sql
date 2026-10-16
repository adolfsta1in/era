-- CreateTable
CREATE TABLE "AdminCredential" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "passwordHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCredential_pkey" PRIMARY KEY ("id")
);

-- Supabase отдаёт схему public через REST API. Хэш пароля не должен быть доступен по anon-ключу:
-- RLS без политик закрывает API, сайт ходит в базу через Prisma (роль postgres, RLS не мешает).
ALTER TABLE "AdminCredential" ENABLE ROW LEVEL SECURITY;
