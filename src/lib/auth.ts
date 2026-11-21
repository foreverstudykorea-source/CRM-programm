import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import {
  createSessionRow,
  findSession,
  revokeSession,
  SESSION_MAX_SECONDS,
  writeAudit,
  type AuditEntry,
  type Role,
  type SessionUser,
} from "./security";

export type { Role } from "./security";
export type User = SessionUser;

const secure = process.env.NODE_ENV === "production";
// The __Host- prefix makes the browser refuse the cookie unless it is Secure, has
// Path=/ and no Domain, so a sibling subdomain cannot plant or overwrite it.
export const SESSION_COOKIE = secure ? "__Host-fs_sid" : "fs_sid";

export const HOME: Record<Role, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
  finance: "/finance",
};

export async function clientMeta() {
  const h = await headers();
  const ip =
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  return { ip: ip ? ip.slice(0, 64) : null, userAgent: h.get("user-agent") };
}

export async function startSession(userId: number) {
  const db = await getDb();
  const { token } = await createSessionRow(db, userId, await clientMeta());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_SECONDS,
    priority: "high",
  });
}

export async function endSession() {
  const jar = await cookies();
  const s = await getSession();
  if (s) await revokeSession(await getDb(), s.id);
  jar.delete(SESSION_COOKIE);
}

/** Current session, looked up once per request. */
export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findSession(await getDb(), token);
});

export async function getCurrentUser(): Promise<User | null> {
  return (await getSession())?.user ?? null;
}

/** Any signed-in user. Users with a temporary password are sent to change it first. */
export async function requireUser(opts: { allowTempPassword?: boolean } = {}): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.must_change_password && !opts.allowTempPassword) redirect("/hisob?yangi=1");
  return user;
}

/**
 * Use at the top of every page and every server action. Authorization is checked on the
 * server for each request; hiding a link in the UI is never the protection.
 */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(HOME[user.role]);
  return user;
}

export async function audit(actor: User | null, entry: AuditEntry) {
  const { ip } = await clientMeta();
  await writeAudit(await getDb(), actor ? { id: actor.id, name: actor.name, role: actor.role } : null, entry, ip);
}
