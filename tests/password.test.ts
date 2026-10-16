import { describe, expect, it } from "vitest";
import { equalsPlain, hashPassword, passwordVersion, verifyPassword } from "@/lib/auth/password";

describe("пароль админки", () => {
  it("хэш проверяется верным паролем и не проверяется неверным", async () => {
    const hash = await hashPassword("Era-2026 пароль");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain("Era-2026");
    expect(await verifyPassword("Era-2026 пароль", hash)).toBe(true);
    expect(await verifyPassword("era-2026 пароль", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("одинаковые пароли дают разные хэши (соль)", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });

  it("испорченная строка хэша не принимается", async () => {
    expect(await verifyPassword("x", "plain-text")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$4$5")).toBe(false);
  });

  it("сравнение с паролем из окружения", () => {
    expect(equalsPlain("admin123", "admin123")).toBe(true);
    expect(equalsPlain("admin12", "admin123")).toBe(false);
  });

  it("версия пароля меняется вместе с паролем, без пароля — env", async () => {
    const a = await hashPassword("first-password");
    const b = await hashPassword("second-password");
    expect(passwordVersion(null)).toBe("env");
    expect(passwordVersion(a)).toBe(passwordVersion(a));
    expect(passwordVersion(a)).not.toBe(passwordVersion(b));
  });
});
