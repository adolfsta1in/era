import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/*
 * Хэш пароля админки: scrypt с солью. Формат строки: scrypt$N$r$p$соль$хэш (base64).
 * Без внешних зависимостей — только node:crypto.
 */

const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 32;

export { MIN_PASSWORD_LENGTH } from "./password-rules";

function derive(password: string, salt: Buffer, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LEN, { ...opts, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, saltB64, keyB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const key = await derive(password, Buffer.from(saltB64, "base64"), { N: Number(n), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Сравнение с паролем из окружения (ADMIN_PASSWORD) за постоянное время. */
export function equalsPlain(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * «Версия пароля» для сессии: меняется при каждой смене пароля, поэтому старые сессии других устройств
 * перестают действовать. "env" — пароль ещё не меняли, действует ADMIN_PASSWORD.
 */
export function passwordVersion(storedHash: string | null): string {
  return storedHash ? createHash("sha256").update(storedHash).digest("base64url").slice(0, 16) : "env";
}
