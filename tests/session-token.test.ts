import { SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { readSession, SESSION_MAX_AGE, signSession, verifySession } from "@/lib/auth/token";

const SECRET = "test-secret-test-secret-test-secret-123";

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

describe("токен сессии админки", () => {
  it("выданный токен читается, содержит время выдачи и версию пароля", async () => {
    const before = Math.floor(Date.now() / 1000);
    const session = await readSession(await signSession("abc123"));
    expect(session).not.toBeNull();
    expect(session!.iat).toBeGreaterThanOrEqual(before - 1);
    expect(session!.pv).toBe("abc123");
  });

  it("старые токены без версии пароля считаются выданными под ADMIN_PASSWORD", async () => {
    const legacy = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect((await readSession(legacy))?.pv).toBe("env");
  });

  it("испорченный или пустой токен не принимается", async () => {
    const token = await signSession("env");
    expect(await verifySession(`${token.slice(0, -2)}xx`)).toBe(false);
    expect(await verifySession(undefined)).toBe(false);
  });

  it("сессия живёт 60 дней", () => {
    expect(SESSION_MAX_AGE).toBe(60 * 24 * 60 * 60);
  });
});
