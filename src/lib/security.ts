// Session, rate-limit and audit primitives. They take the database as an argument and
// have no Next.js imports, so the tests can exercise them directly.
import { createHmac, randomBytes } from "node:crypto";
import type { Db } from "./db-core";

export type Role = "student" | "teacher" | "admin" | "finance";
export const ROLES: Role[] = ["student", "teacher", "admin", "finance"];

export type SessionUser = {
  id: number;
  name: string;
  login: string;
  role: Role;
  phone: string | null;
  must_change_password: boolean;
};

// ---------------------------------------------------------------- Secrets ---

const DEV_SECRET = "dev-only-secret-never-use-in-production-000000000000";

export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    // Fail closed: without a strong secret, nobody can log in.
    throw new Error("SESSION_SECRET must be set to at least 32 random characters (openssl rand -base64 32).");
  }
  return DEV_SECRET;
}

// --------------------------------------------------------------- Sessions ---

export const SESSION_IDLE_SECONDS = 60 * 60 * 12; // logged out after 12 hours without activity
export const SESSION_MAX_SECONDS = 60 * 60 * 24 * 7; // and after 7 days at most
const TOUCH_EVERY_SECONDS = 60 * 5;

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this keyed hash is stored, so a leaked database row cannot be replayed as a cookie. */
export function sessionId(token: string, secret = sessionSecret()): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function createSessionRow(
  db: Db,
  userId: number,
  meta: { ip: string | null; userAgent: string | null },
): Promise<{ token: string; id: string }> {
  const token = newSessionToken();
  const id = sessionId(token);
  await db.query(
    `insert into sessions (id, user_id, expires_at, ip, user_agent)
     values ($1, $2, now() + make_interval(secs => $3), $4, $5)`,
    [id, userId, SESSION_MAX_SECONDS, meta.ip, meta.userAgent?.slice(0, 300) ?? null],
  );
  // Housekeeping: drop expired sessions and old rate-limit rows.
  await db.query(`delete from sessions where expires_at < now() or last_seen_at < now() - make_interval(secs => $1)`, [
    SESSION_IDLE_SECONDS,
  ]);
  await db.query(`delete from auth_attempts where at < now() - interval '1 day'`);
  return { token, id };
}

export async function findSession(db: Db, token: string): Promise<{ id: string; user: SessionUser } | null> {
  if (!token || token.length > 100) return null;
  const id = sessionId(token);
  const [row] = await db.query<SessionUser & { sid: string; idle: number }>(
    `select s.id as sid, extract(epoch from (now() - s.last_seen_at))::int as idle,
       u.id, u.name, u.login, u.role, u.phone, u.must_change_password
     from sessions s join users u on u.id = s.user_id
     where s.id = $1 and s.expires_at > now()
       and s.last_seen_at > now() - make_interval(secs => $2)
       and u.active and u.password_hash is not null`,
    [id, SESSION_IDLE_SECONDS],
  );
  if (!row) return null;
  if (row.idle > TOUCH_EVERY_SECONDS) {
    await db.query(`update sessions set last_seen_at = now() where id = $1`, [id]);
  }
  const { sid, idle: _idle, ...user } = row;
  void _idle;
  return { id: sid, user };
}

export async function revokeSession(db: Db, id: string) {
  await db.query(`delete from sessions where id = $1`, [id]);
}

export async function revokeUserSessions(db: Db, userId: number, exceptId?: string) {
  await db.query(`delete from sessions where user_id = $1 and id <> $2`, [userId, exceptId ?? ""]);
}

// ------------------------------------------------------------ Rate limits ---

export type Limit = { key: string; max: number; windowSeconds: number };

export const LOGIN_LIMITS = (login: string, ip: string): Limit[] => [
  { key: `login:${login}`, max: 5, windowSeconds: 15 * 60 }, // 5 wrong passwords per account per 15 min
  { key: `ip:${ip}`, max: 20, windowSeconds: 15 * 60 }, // 20 failures per address per 15 min
];

/** Returns seconds until the caller may retry, or 0 when allowed. Counts failures only. */
export async function checkLimits(db: Db, limits: Limit[]): Promise<number> {
  let wait = 0;
  for (const l of limits) {
    const [r] = await db.query<{ n: number; first: number | null }>(
      `select count(*)::int as n, extract(epoch from (min(at) + make_interval(secs => $3) - now()))::int as first
       from auth_attempts where key = $1 and not success and at > now() - make_interval(secs => $2)`,
      [l.key, l.windowSeconds, l.windowSeconds],
    );
    if (r.n >= l.max) wait = Math.max(wait, Math.max(r.first ?? l.windowSeconds, 1));
  }
  return wait;
}

export async function recordAttempt(db: Db, keys: string[], success: boolean) {
  for (const key of keys) {
    if (success) await db.query(`delete from auth_attempts where key = $1 and not success`, [key]);
    else await db.query(`insert into auth_attempts (key, success) values ($1, false)`, [key]);
  }
}

// ------------------------------------------------------------------ Audit ---

export type AuditActor = { id: number; name: string; role: Role } | null;

export type AuditEntry = {
  action: string;
  entity?: string;
  entityId?: string | number | null;
  details?: Record<string, unknown>;
};

export async function writeAudit(db: Db, actor: AuditActor, entry: AuditEntry, ip: string | null) {
  await db.query(
    `insert into audit_log (actor_id, actor_name, actor_role, action, entity, entity_id, details, ip)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      actor?.id ?? null,
      actor?.name ?? null,
      actor?.role ?? null,
      entry.action,
      entry.entity ?? null,
      entry.entityId == null ? null : String(entry.entityId),
      entry.details ? JSON.stringify(entry.details) : null,
      ip,
    ],
  );
}
