import { beforeAll, describe, expect, it } from "vitest";
import { readSession, SESSION_MAX_AGE, signSession, verifySession } from "@/lib/auth/token";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
});

describe("токен сессии админки", () => {
  it("выданный токен читается и содержит время выдачи", async () => {
    const before = Math.floor(Date.now() / 1000);
    const session = await readSession(await signSession());
    expect(session).not.toBeNull();
    expect(session!.iat).toBeGreaterThanOrEqual(before - 1);
  });

  it("испорченный или пустой токен не принимается", async () => {
    const token = await signSession();
    expect(await verifySession(`${token.slice(0, -2)}xx`)).toBe(false);
    expect(await verifySession(undefined)).toBe(false);
  });

  it("сессия живёт 60 дней", () => {
    expect(SESSION_MAX_AGE).toBe(60 * 24 * 60 * 60);
  });
});
