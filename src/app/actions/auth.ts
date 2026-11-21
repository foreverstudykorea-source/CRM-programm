"use server";

import { timingSafeEqual, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { audit, clientMeta, endSession, getSession, HOME, requireUser, startSession } from "@/lib/auth";
import { getDb, q, tx } from "@/lib/db";
import { activeAdminCount } from "@/lib/data";
import { done, fail, type FormState } from "@/lib/form-state";
import { checkPasswordPolicy, hashPassword, verifyPassword } from "@/lib/password";
import { DEMO_LOGINS, seedDemo } from "@/lib/seed";
import {
  checkLimits,
  LOGIN_LIMITS,
  recordAttempt,
  revokeUserSessions,
  writeAudit,
  type Role,
} from "@/lib/security";
import { changePasswordSchema, loginSchema, parseForm, setupSchema } from "@/lib/validation";

const minutes = (s: number) => Math.max(1, Math.ceil(s / 60));

// ------------------------------------------------------------------ Login ---

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = parseForm(loginSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const { login, password } = parsed.data;
  const db = await getDb();
  const { ip } = await clientMeta();
  const limits = LOGIN_LIMITS(login, ip ?? "unknown");

  const wait = await checkLimits(db, limits);
  if (wait > 0) {
    await writeAudit(db, null, { action: "auth.login_blocked", details: { login } }, ip);
    return fail(`Juda ko'p noto'g'ri urinish. ${minutes(wait)} daqiqadan so'ng qayta urinib ko'ring.`);
  }

  const [user] = await q<{ id: number; name: string; role: Role; password_hash: string | null; active: boolean }>(
    `select id, name, role, password_hash, active from users where lower(login) = $1`,
    [login],
  );
  // Always run a full password check, even for unknown logins, so timing reveals nothing.
  const check = await verifyPassword(password, user?.active ? user.password_hash : null);

  if (!user || !check.ok) {
    await recordAttempt(db, limits.map((l) => l.key), false);
    await writeAudit(db, null, { action: "auth.login_failed", details: { login } }, ip);
    // The same message for "no such login", "wrong password" and "account disabled".
    return fail("Login yoki parol noto'g'ri");
  }

  await recordAttempt(db, [limits[0].key], true);
  if (check.rehash) {
    await q(`update users set password_hash = $1 where id = $2`, [await hashPassword(password), user.id]);
  }
  await q(`update users set last_login_at = now() where id = $1`, [user.id]);
  await startSession(user.id);
  await writeAudit(db, { id: user.id, name: user.name, role: user.role }, { action: "auth.login" }, ip);
  redirect(HOME[user.role]);
}

export async function logoutAction() {
  const s = await getSession();
  if (s) await audit(s.user, { action: "auth.logout" });
  await endSession();
  redirect("/login");
}

// --------------------------------------------------------------- Password ---

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser({ allowTempPassword: true });
  const session = await getSession();
  const parsed = parseForm(changePasswordSchema, form);
  if (!parsed.ok) return fail(parsed.error, parsed.field);
  const { current, next } = parsed.data;

  const db = await getDb();
  const key = `pw:${user.id}`;
  const wait = await checkLimits(db, [{ key, max: 5, windowSeconds: 15 * 60 }]);
  if (wait > 0) return fail(`Juda ko'p urinish. ${minutes(wait)} daqiqadan so'ng qayta urinib ko'ring.`);

  const [row] = await q<{ password_hash: string | null }>(`select password_hash from users where id = $1`, [user.id]);
  const check = await verifyPassword(current, row?.password_hash);
  if (!check.ok) {
    await recordAttempt(db, [key], false);
    return fail("Joriy parol noto'g'ri", "current");
  }
  const policy = checkPasswordPolicy(next, user.login);
  if (policy) return fail(policy, "next");
  if (next === current) return fail("Yangi parol eskisidan farq qilsin", "next");

  await q(
    `update users set password_hash = $1, must_change_password = false, password_changed_at = now() where id = $2`,
    [await hashPassword(next), user.id],
  );
  await recordAttempt(db, [key], true);
  // Every other device is signed out; this one stays.
  await revokeUserSessions(db, user.id, session?.id);
  await audit(user, { action: "auth.password_changed", entity: "user", entityId: user.id });
  if (user.must_change_password) redirect(HOME[user.role]);
  return done("Parol yangilandi. Boshqa qurilmalardagi sessiyalar yopildi.");
}

export async function logoutOtherDevicesAction() {
  const user = await requireUser({ allowTempPassword: true });
  const session = await getSession();
  await revokeUserSessions(await getDb(), user.id, session?.id);
  await audit(user, { action: "auth.sessions_revoked", entity: "user", entityId: user.id });
  redirect("/hisob");
}

// ------------------------------------------------------------------ Setup ---

function tokenMatches(given: string): boolean {
  const expected = process.env.SETUP_TOKEN;
  if (!expected || expected.length < 16) return false;
  // Compare digests so the comparison takes the same time whatever the input length.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function setupAction(_: FormState, form: FormData): Promise<FormState> {
  if ((await activeAdminCount()) > 0) return fail("Tizim allaqachon sozlangan. Kirish sahifasidan foydalaning.");
  if (!process.env.SETUP_TOKEN || process.env.SETUP_TOKEN.length < 16) {
    return fail("Serverda SETUP_TOKEN o'rnatilmagan (kamida 16 belgi). Vercel → Settings → Environment Variables.");
  }

  const db = await getDb();
  const { ip } = await clientMeta();
  const key = `setup:${ip ?? "unknown"}`;
  const wait = await checkLimits(db, [{ key, max: 5, windowSeconds: 30 * 60 }]);
  if (wait > 0) return fail(`Juda ko'p urinish. ${minutes(wait)} daqiqadan so'ng qayta urinib ko'ring.`);

  const parsed = parseForm(setupSchema, form);
  if (!parsed.ok) return fail(parsed.error, parsed.field);
  const v = parsed.data;

  if (!tokenMatches(v.token)) {
    await recordAttempt(db, [key], false);
    await writeAudit(db, null, { action: "setup.bad_token" }, ip);
    return fail("Sozlash kaliti noto'g'ri", "token");
  }
  const policy = checkPasswordPolicy(v.password, v.login);
  if (policy) return fail(policy, "password");
  if (v.demo && DEMO_LOGINS.includes(v.login)) return fail("Bu login demo hisoblar uchun band, boshqasini tanlang", "login");

  const hash = await hashPassword(v.password);
  const result = await tx(async (t) => {
    await t.query(`select pg_advisory_xact_lock(7310413)`);
    const [{ n }] = await t.query<{ n: number }>(
      `select count(*)::int as n from users where role = 'admin' and active and password_hash is not null`,
    );
    if (n > 0) return null;
    const [existing] = await t.query<{ id: number }>(`select id from users where lower(login) = $1`, [v.login]);
    let adminId: number;
    if (existing) {
      // A disabled legacy account with the same login is reactivated as the owner.
      await t.query(
        `update users set name = $1, password_hash = $2, role = 'admin', active = true, must_change_password = false,
           password_changed_at = now() where id = $3`,
        [v.name, hash, existing.id],
      );
      adminId = existing.id;
    } else {
      const [u] = await t.query<{ id: number }>(
        `insert into users (name, login, password_hash, role, password_changed_at) values ($1, $2, $3, 'admin', now()) returning id`,
        [v.name, v.login, hash],
      );
      adminId = u.id;
    }
    const [{ empty }] = await t.query<{ empty: boolean }>(`select not exists (select 1 from groups) as empty`);
    const creds = v.demo && empty ? await seedDemo(t, { withAdmin: false, adminId }) : [];
    return { adminId, creds };
  });
  if (!result) return fail("Tizim allaqachon sozlangan.");

  await writeAudit(
    db,
    { id: result.adminId, name: v.name, role: "admin" },
    { action: "setup.completed", entity: "user", entityId: result.adminId, details: { demo: !!v.demo } },
    ip,
  );
  await startSession(result.adminId);
  if (!result.creds.length) redirect("/admin");
  return done("Tizim sozlandi", { credentials: result.creds });
}
