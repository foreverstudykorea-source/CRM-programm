import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q } from "./db";

export type Role = "student" | "teacher" | "admin" | "finance";
export type User = { id: number; name: string; login: string; role: Role; phone: string | null };

const COOKIE = "fs_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    // Still works on a fresh deploy, but anyone who reads the code could forge a session.
    console.warn("[auth] SESSION_SECRET is not set. Set it in Vercel → Settings → Environment Variables.");
  }
  return s || "forever-study-dev-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createSession(userId: number) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${exp}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

async function readUserId(): Promise<number | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const expected = Buffer.from(sign(`${id}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return Number(id);
}

export async function getCurrentUser(): Promise<User | null> {
  const id = await readUserId();
  if (!id) return null;
  const [user] = await q<User>("select id, name, login, role, phone from users where id = $1", [id]);
  return user ?? null;
}

export const HOME: Record<Role, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
  finance: "/finance",
};

/** Use at the top of every role page/action. Redirects if the user may not be here. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(HOME[user.role]);
  return user;
}
