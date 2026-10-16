/**
 * Нормализация кыргызстанского номера в E.164: +996XXXXXXXXX.
 * Принимает «+996 (555) 12-34-56», «0555 123 456», «996555123456».
 */
export function normalizeKgPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) digits = `996${digits.slice(1)}`;
  if (digits.length === 9) digits = `996${digits}`;
  if (digits.length !== 12 || !digits.startsWith("996")) return null;
  // Мобильные и городские коды начинаются с 2–9.
  if (!/^996[2-9]\d{8}$/.test(digits)) return null;
  return `+${digits}`;
}

/** +996555123456 → +996 555 123 456 */
export function formatKgPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  if (d.length !== 12) return e164;
  return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

/** Номер не введён: пустая строка или пустая маска «+996 (___) ___-___». */
export function isBlankPhone(input: string | null | undefined): boolean {
  const digits = (input ?? "").replace(/\D/g, "");
  return digits === "" || digits === "996";
}
