import { randomBytes, scryptSync } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db-core";
import { createDb } from "@/lib/db-core";
import { migrate, MIGRATIONS } from "@/lib/migrations";
import {
  checkLimits,
  createSessionRow,
  findSession,
  LOGIN_LIMITS,
  recordAttempt,
  revokeSession,
  revokeUserSessions,
  sessionId,
  writeAudit,
} from "@/lib/security";
import { hashPassword } from "@/lib/password";
import { testDb } from "./helpers";

let db: Db;
let userId: number;

beforeAll(async () => {
  db = await testDb();
  const [u] = await db.query<{ id: number }>(
    `insert into users (name, login, password_hash, role) values ('Test Admin', 'tadmin', $1, 'admin') returning id`,
    [await hashPassword("Tashkent-Spring-2026")],
  );
  userId = u.id;
});
afterAll(() => db.close());

describe("sessions", () => {
  it("stores only a keyed hash of the token", async () => {
    const { token, id } = await createSessionRow(db, userId, { ip: "1.2.3.4", userAgent: "vitest" });
    expect(id).toBe(sessionId(token));
    expect(id).not.toContain(token);
    const rows = await db.query<{ id: string }>(`select id from sessions where id = $1`, [token]);
    expect(rows).toHaveLength(0);
  });

  it("finds a valid session and rejects forged or revoked ones", async () => {
    const { token, id } = await createSessionRow(db, userId, { ip: null, userAgent: null });
    const s = await findSession(db, token);
    expect(s?.user.login).toBe("tadmin");
    expect(await findSession(db, token + "x")).toBeNull();
    expect(await findSession(db, randomBytes(32).toString("base64url"))).toBeNull();
    await revokeSession(db, id);
    expect(await findSession(db, token)).toBeNull();
  });

  it("expires idle and old sessions", async () => {
    const a = await createSessionRow(db, userId, { ip: null, userAgent: null });
    await db.query(`update sessions set last_seen_at = now() - interval '13 hours' where id = $1`, [a.id]);
    expect(await findSession(db, a.token)).toBeNull();
    const b = await createSessionRow(db, userId, { ip: null, userAgent: null });
    await db.query(`update sessions set expires_at = now() - interval '1 second' where id = $1`, [b.id]);
    expect(await findSession(db, b.token)).toBeNull();
  });

  it("drops sessions of blocked users immediately", async () => {
    const { token } = await createSessionRow(db, userId, { ip: null, userAgent: null });
    await db.query(`update users set active = false where id = $1`, [userId]);
    expect(await findSession(db, token)).toBeNull();
    await db.query(`update users set active = true where id = $1`, [userId]);
    expect(await findSession(db, token)).not.toBeNull();
  });

  it("can sign a user out everywhere except the current device", async () => {
    const keep = await createSessionRow(db, userId, { ip: null, userAgent: null });
    const other = await createSessionRow(db, userId, { ip: null, userAgent: null });
    await revokeUserSessions(db, userId, keep.id);
    expect(await findSession(db, keep.token)).not.toBeNull();
    expect(await findSession(db, other.token)).toBeNull();
  });
});

describe("login rate limiting", () => {
  it("locks an account after 5 failures and unlocks on success", async () => {
    const limits = LOGIN_LIMITS("victim", "9.9.9.9");
    for (let i = 0; i < 4; i++) await recordAttempt(db, limits.map((l) => l.key), false);
    expect(await checkLimits(db, limits)).toBe(0);
    await recordAttempt(db, limits.map((l) => l.key), false);
    const wait = await checkLimits(db, limits);
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(15 * 60);
    await recordAttempt(db, [limits[0].key], true);
    expect(await checkLimits(db, [limits[0]])).toBe(0);
  });

  it("limits one address that tries many logins", async () => {
    for (let i = 0; i < 20; i++) await recordAttempt(db, LOGIN_LIMITS(`user${i}`, "6.6.6.6").map((l) => l.key), false);
    expect(await checkLimits(db, LOGIN_LIMITS("fresh-login", "6.6.6.6"))).toBeGreaterThan(0);
    expect(await checkLimits(db, LOGIN_LIMITS("fresh-login", "7.7.7.7"))).toBe(0);
  });
});

describe("audit log", () => {
  it("is append-only", async () => {
    await writeAudit(db, { id: userId, name: "Test Admin", role: "admin" }, { action: "payment.added", details: { amount: 1 } }, "1.1.1.1");
    const [row] = await db.query<{ id: number; details: { amount: number } }>(`select id, details from audit_log order by id desc limit 1`);
    expect(row.details.amount).toBe(1);
    await expect(db.query(`update audit_log set action = 'x' where id = $1`, [row.id])).rejects.toThrow(/append-only/);
    await expect(db.query(`delete from audit_log where id = $1`, [row.id])).rejects.toThrow(/append-only/);
  });
});

describe("upgrade from the first version", () => {
  it("switches off accounts that still use the public demo password", async () => {
    const old = await createDb({ url: "", pgliteDir: null });
    await old.exec(`create table schema_migrations (id int primary key, name text not null, applied_at timestamptz not null default now())`);
    await MIGRATIONS[0].up(old);
    await old.query(`insert into schema_migrations (id, name) values (1, 'base schema')`);
    const legacy = (pw: string) => {
      const salt = randomBytes(16).toString("hex");
      return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
    };
    await old.query(`insert into users (name, login, password_hash, role) values ('A', 'admin', $1, 'admin'), ('B', 'own', $2, 'teacher')`, [
      legacy("demo123"),
      legacy("MyOwnPassword7"),
    ]);
    await migrate(old);
    const rows = await old.query<{ login: string; password_hash: string | null }>(`select login, password_hash from users order by login`);
    expect(rows.find((r) => r.login === "admin")?.password_hash).toBeNull();
    expect(rows.find((r) => r.login === "own")?.password_hash).not.toBeNull();
    await old.close();
  });
});
