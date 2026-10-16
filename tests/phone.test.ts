import { describe, expect, it } from "vitest";
import { formatKgPhone, isBlankPhone, normalizeKgPhone } from "@/lib/validators/phone";

describe("телефон +996", () => {
  it.each([
    ["+996 (555) 12-34-56", "+996555123456"],
    ["0555 123 456", "+996555123456"],
    ["996700112233", "+996700112233"],
    ["555123456", "+996555123456"],
    ["+996 312 00 00 00", "+996312000000"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeKgPhone(input)).toBe(expected);
  });

  it.each(["", "+996 555 12", "+7 777 123 45 67", "+996 055 123 456", "abc"])("отклоняет «%s»", (input) => {
    expect(normalizeKgPhone(input)).toBeNull();
  });

  it("форматирует для отображения", () => {
    expect(formatKgPhone("+996555123456")).toBe("+996 555 123 456");
  });
});

describe("пустой телефон (запись из админки)", () => {
  it.each(["", "   ", "+996 (___) ___-___", "+996"])("«%s» — номер не введён", (input) => {
    expect(isBlankPhone(input)).toBe(true);
  });

  it.each(["+996 (555) 12-34-56", "+996 (5", "0555"])("«%s» — номер начали вводить", (input) => {
    expect(isBlankPhone(input)).toBe(false);
  });
});
