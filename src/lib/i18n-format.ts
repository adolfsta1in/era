import { formatNumber } from "./format";

type PriceT = (
  key: "priceFrom" | "priceRange" | "priceFromUsd" | "priceRangeUsd",
  values: Record<string, string>,
) => string;

/** Валюта цены услуги: сом (по умолчанию) или доллары. */
export type Currency = "KGS" | "USD";

/** «от 3 500 сом» / «3 500 – 6 000 сом» (или «от 100 $» для услуг в долларах) с переводом. */
export function priceLabel(
  t: PriceT,
  priceFrom: number,
  priceTo?: number | null,
  mode: "from" | "range" = "from",
  currency: string = "KGS",
) {
  const usd = currency === "USD";
  if (mode === "range" && priceTo && priceTo > priceFrom) {
    return t(usd ? "priceRangeUsd" : "priceRange", { from: formatNumber(priceFrom), to: formatNumber(priceTo) });
  }
  return t(usd ? "priceFromUsd" : "priceFrom", { price: formatNumber(priceFrom) });
}

/** Цена услуги с её валютой. */
export function servicePrice(
  t: PriceT,
  s: { priceFrom: number; priceTo?: number | null; currency?: string },
  mode: "from" | "range" = "from",
) {
  return priceLabel(t, s.priceFrom, s.priceTo, mode, s.currency);
}

/** Для админки (без переводов): «от 3 500 сом» / «от 100 $». */
export function adminPrice(priceFrom: number, currency: string = "KGS") {
  return `от ${formatNumber(priceFrom)} ${currency === "USD" ? "$" : "сом"}`;
}

// Год фиксируется при старте сервера/сборке: так страницы остаются статическими.
const CURRENT_YEAR = new Date().getFullYear();

export function yearsSince(year: number) {
  return Math.max(1, CURRENT_YEAR - year);
}
