import { randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";

// Argon2id with the OWASP-recommended minimum (19 MiB memory, 2 iterations).
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export async function hashPassword(password: string): Promise<string> {
  return argonHash(password, ARGON);
}

/** Verifies the old `salt:hash` scrypt format used by the first version of the app. */
export function verifyLegacyScrypt(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || !/^[0-9a-f]+$/i.test(hash)) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

let dummy: Promise<string> | null = null;

/**
 * Returns whether the password matches, and whether the stored hash should be upgraded.
 * When there is no stored hash it still spends the same time, so response timing does
 * not reveal which logins exist.
 */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<{ ok: boolean; rehash: boolean }> {
  if (!stored) {
    dummy ??= hashPassword("timing-equaliser-" + randomInt(1e9));
    await argonVerify(await dummy, password).catch(() => false);
    return { ok: false, rehash: false };
  }
  if (stored.startsWith("$argon2")) {
    const ok = await argonVerify(stored, password).catch(() => false);
    return { ok, rehash: false };
  }
  const ok = verifyLegacyScrypt(password, stored);
  return { ok, rehash: ok };
}

const COMMON = new Set([
  "password", "password1", "password123", "qwerty123", "qwertyuiop", "1234567890", "12345678910",
  "123456789a", "parol12345", "admin12345", "administrator", "iloveyou12", "foreverstudy", "forever123",
  "demo123456", "uzbekistan", "tashkent123", "toshkent123",
]);

/** Returns an error message in Uzbek, or null when the password is acceptable. */
export function checkPasswordPolicy(password: string, login?: string | null): string | null {
  if (password.length < 10) return "Parol kamida 10 belgidan iborat bo'lsin";
  if (password.length > 128) return "Parol juda uzun";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Parolda harf ham, raqam ham bo'lsin";
  if (/^(.)\1+$/.test(password)) return "Parol juda oddiy";
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return "Bu parol juda keng tarqalgan, boshqasini tanlang";
  if (login && login.length >= 3 && lower.includes(login.toLowerCase())) return "Parolda login bo'lmasin";
  return null;
}

// No 0/O, 1/l/I so the password can be read aloud or written down without mistakes.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Random password like `Kp7m-x3Qa-9vRt` (~70 bits of entropy). */
export function generatePassword(): string {
  for (;;) {
    const chars = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]);
    const pw = `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
    if (!checkPasswordPolicy(pw)) return pw;
  }
}
