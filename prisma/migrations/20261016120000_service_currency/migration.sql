-- Валюта цены услуги: KGS (сом) по умолчанию, USD — для услуг в долларах.
ALTER TABLE "Service" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'KGS';
