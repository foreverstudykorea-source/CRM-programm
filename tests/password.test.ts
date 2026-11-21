import { randomBytes, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { checkPasswordPolicy, generatePassword, hashPassword, verifyPassword } from "@/lib/password";

const legacy = (pw: string) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
};

describe("passwords", () => {
  it("hashes with Argon2id and verifies", async () => {
    const h = await hashPassword("Correct-horse-42");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword("Correct-horse-42", h)).toEqual({ ok: true, rehash: false });
    expect((await verifyPassword("wrong-password-1", h)).ok).toBe(false);
  });

  it("accepts old scrypt hashes once and asks to upgrade them", async () => {
    expect(await verifyPassword("OldPassword9", legacy("OldPassword9"))).toEqual({ ok: true, rehash: true });
    expect((await verifyPassword("nope", legacy("OldPassword9"))).ok).toBe(false);
  });

  it("fails for missing hashes", async () => {
    expect((await verifyPassword("anything", null)).ok).toBe(false);
  });

  it("enforces the password policy", () => {
    expect(checkPasswordPolicy("demo123")).toMatch(/10/);
    expect(checkPasswordPolicy("onlyletterslong")).toMatch(/raqam/);
    expect(checkPasswordPolicy("password123")).toMatch(/keng tarqalgan/);
    expect(checkPasswordPolicy("ustoz1-Secret9", "ustoz1")).toMatch(/login/);
    expect(checkPasswordPolicy("Tashkent-Spring-2026")).toBeNull();
  });

  it("generates strong, unique passwords", () => {
    const set = new Set(Array.from({ length: 200 }, generatePassword));
    expect(set.size).toBe(200);
    for (const p of set) {
      expect(p).toMatch(/^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/);
      expect(checkPasswordPolicy(p)).toBeNull();
    }
  });
});
