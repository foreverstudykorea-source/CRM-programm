import { describe, expect, it } from "vitest";
import { verifyPassword } from "@/lib/password";
import { seedDemo } from "@/lib/seed";
import { testDb } from "./helpers";

describe("demo seed", () => {
  it("gives every account its own random password and stores only hashes", async () => {
    const db = await testDb();
    const creds = await db.transaction((t) => seedDemo(t, { withAdmin: true }));
    expect(creds.length).toBe(30);
    expect(new Set(creds.map((c) => c.password)).size).toBe(creds.length);
    expect(creds.some((c) => c.password === "demo123")).toBe(false);

    const rows = await db.query<{ login: string; password_hash: string }>(`select login, password_hash from users`);
    for (const r of rows) expect(r.password_hash.startsWith("$argon2id$")).toBe(true);
    const admin = creds.find((c) => c.login === "admin")!;
    const hash = rows.find((r) => r.login === "admin")!.password_hash;
    expect((await verifyPassword(admin.password, hash)).ok).toBe(true);

    const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from attendance`);
    expect(n).toBeGreaterThan(50);

    // The demo flag drives the "DEMO VERSIYA" banner on every page.
    const [flag] = await db.query<{ value: string }>(`select value from app_settings where key = 'demo_data'`);
    expect(flag?.value).toBe("1");
    await db.close();
  });
});
