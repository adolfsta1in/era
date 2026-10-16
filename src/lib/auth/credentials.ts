import "server-only";
import { db } from "../db";
import { equalsPlain, hashPassword, passwordVersion, verifyPassword } from "./password";

/** Хэш пароля из «Настроек» или null — тогда действует ADMIN_PASSWORD из окружения. */
async function storedHash(): Promise<string | null> {
  const row = await db.adminCredential.findUnique({ where: { id: 1 }, select: { passwordHash: true } });
  return row?.passwordHash ?? null;
}

export async function checkPassword(input: string): Promise<boolean> {
  const hash = await storedHash();
  if (hash) return verifyPassword(input, hash);
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && equalsPlain(input, expected!);
}

export async function currentPasswordVersion(): Promise<string> {
  return passwordVersion(await storedHash());
}

/** Сохраняет новый пароль и возвращает его «версию» для сессии текущего устройства. */
export async function setPassword(password: string): Promise<string> {
  const passwordHash = await hashPassword(password);
  await db.adminCredential.upsert({ where: { id: 1 }, update: { passwordHash }, create: { id: 1, passwordHash } });
  return passwordVersion(passwordHash);
}
