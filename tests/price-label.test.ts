import { describe, expect, it } from "vitest";
import { adminPrice, priceLabel, servicePrice } from "@/lib/i18n-format";

const MESSAGES: Record<string, string> = {
  priceFrom: "от {price} сом",
  priceRange: "{from} – {to} сом",
  priceFromUsd: "от {price} $",
  priceRangeUsd: "{from} – {to} $",
};
const t = (key: string, v: Record<string, string>) => MESSAGES[key].replace(/\{(\w+)\}/g, (_, k: string) => v[k]);
const clean = (s: string) => s.replace(/\s/g, " ");

describe("цена услуги", () => {
  it("по умолчанию в сомах", () => {
    expect(clean(priceLabel(t, 35000))).toBe("от 35 000 сом");
    expect(clean(servicePrice(t, { priceFrom: 1000, priceTo: 5000 }, "range"))).toBe("1 000 – 5 000 сом");
  });

  it("услуги в долларах — со знаком $", () => {
    expect(servicePrice(t, { priceFrom: 100, currency: "USD" })).toBe("от 100 $");
    expect(clean(servicePrice(t, { priceFrom: 100, priceTo: 150, currency: "USD" }, "range"))).toBe("100 – 150 $");
  });

  it("в админке", () => {
    expect(clean(adminPrice(80000))).toBe("от 80 000 сом");
    expect(adminPrice(100, "USD")).toBe("от 100 $");
  });
});
