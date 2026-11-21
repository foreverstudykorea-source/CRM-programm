// End-to-end checks of the server actions against a real (in-memory) Postgres.
// Next.js request APIs are replaced with small fakes.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db-core";

class Redirect extends Error {
  constructor(public to: string) {
    super("REDIRECT " + to);
  }
}
const jar = new Map<string, string>();
let ip = "10.0.0.1";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n)! } : undefined),
    set: (n: string, v: string) => void jar.set(n, v),
    delete: (n: string) => void jar.delete(n),
  }),
  headers: async () => new Headers({ "x-real-ip": ip, "user-agent": "vitest" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Redirect(to);
  },
  notFound: () => {
    throw new Redirect("404");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { testDb } = await import("./helpers");
const { seedDemo } = await import("@/lib/seed");
const auth = await import("@/app/actions/auth");
const staff = await import("@/app/actions/staff");
const data = await import("@/lib/data");
const { addDays, today, monthOf } = await import("@/lib/dates");

let db: Db;
let creds: { login: string; password: string; role: string }[];
const pw = (login: string) => creds.find((c) => c.login === login)!.password;

const form = (o: Record<string, string | number>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.append(k, String(v));
  return f;
};

async function expectRedirect(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    if (e instanceof Redirect) return e.to;
    throw e;
  }
  throw new Error("expected a redirect");
}

async function signIn(login: string, password = pw(login)) {
  jar.clear();
  return expectRedirect(auth.loginAction(undefined, form({ login, password })));
}

beforeAll(async () => {
  db = await testDb();
  (globalThis as unknown as { __fsDb?: Promise<Db> }).__fsDb = Promise.resolve(db);
  creds = await db.transaction((t) => seedDemo(t, { withAdmin: true }));
});
afterAll(() => db.close());
beforeEach(() => {
  jar.clear();
  ip = `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
});

describe("login", () => {
  it("signs in with the right password and sets an opaque session cookie", async () => {
    expect(await signIn("ustoz1")).toBe("/teacher");
    const cookie = [...jar.values()][0];
    expect(cookie).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(cookie).not.toContain("ustoz1");
  });

  it("gives the same answer for an unknown login and a wrong password", async () => {
    const a = await auth.loginAction(undefined, form({ login: "nobody", password: "whatever-123" }));
    const b = await auth.loginAction(undefined, form({ login: "ustoz2", password: "whatever-123" }));
    expect(a?.error).toBe(b?.error);
  });

  it("blocks password guessing after 5 failures, even with the right password", async () => {
    for (let i = 0; i < 5; i++) await auth.loginAction(undefined, form({ login: "moliya", password: `guess-${i}-xyz` }));
    const r = await auth.loginAction(undefined, form({ login: "moliya", password: pw("moliya") }));
    expect(r?.error).toMatch(/Juda ko'p/);
    await db.query(`delete from auth_attempts where key = 'login:moliya'`);
  });

  it("rejects the old public demo password", async () => {
    const r = await auth.loginAction(undefined, form({ login: "admin", password: "demo123" }));
    expect(r?.error).toBeTruthy();
  });
});

describe("role checks on the server", () => {
  it("a student cannot run admin or finance actions", async () => {
    await signIn("oquvchi1");
    expect(await expectRedirect(staff.logCallAction(undefined, form({ attendance_id: 1, outcome: "called" })))).toBe("/student");
    expect(
      await expectRedirect(
        staff.addPaymentAction(undefined, form({ student_id: 1, amount: 1000, month: monthOf(today()), paid_at: today(), method: "Naqd" })),
      ),
    ).toBe("/student");
    expect(await expectRedirect(staff.createStaffAction(undefined, form({ name: "Hacker", login: "hacker", role: "admin" })))).toBe("/student");
    expect(await data.loginExists("hacker")).toBe(false);
  });

  it("a teacher cannot mark another teacher's group", async () => {
    await signIn("ustoz1");
    const groups = await data.listGroups();
    const foreign = groups.find((g) => g.teacher_name !== "Dilnoza Karimova")!;
    const r = await staff.saveAttendanceAction(undefined, form({ group_id: foreign.id, date: today(), s_1: "absent" }));
    expect(r?.error).toMatch(/biriktirilmagan/);
    const denied = await db.query(`select 1 from audit_log where action = 'security.denied'`);
    expect(denied.length).toBeGreaterThan(0);
  });

  it("a teacher marks their own group, absences reach the admin, and it is audited", async () => {
    await signIn("ustoz1");
    const groups = (await data.listGroups()).filter((g) => g.teacher_name === "Dilnoza Karimova");
    let target: { id: number; date: string } | null = null;
    for (let d = 0; d >= -3 && !target; d--)
      for (const g of groups) if (!target && data.groupMeetsOn(g, addDays(today(), d))) target = { id: g.id, date: addDays(today(), d) };
    expect(target).not.toBeNull();
    const { rows } = await data.roster(target!.id, target!.date);
    const f = form({ group_id: target!.id, date: target!.date, topic: "Test mavzu" });
    rows.forEach((r, i) => f.append(`s_${r.student_id}`, i === 0 ? "absent" : "present"));
    f.append("s_999999", "absent"); // a student from elsewhere is ignored
    const res = await staff.saveAttendanceAction(undefined, f);
    expect(res?.ok).toBe(true);
    const list = await data.absences(target!.date, target!.date);
    expect(list.some((a) => a.student_id === rows[0].student_id)).toBe(true);
    const audit = await db.query(`select 1 from audit_log where action in ('attendance.marked','attendance.corrected')`);
    expect(audit.length).toBeGreaterThan(0);
  });

  it("a teacher cannot rewrite old attendance", async () => {
    await signIn("ustoz1");
    const g = (await data.listGroups()).find((x) => x.teacher_name === "Dilnoza Karimova")!;
    const r = await staff.saveAttendanceAction(undefined, form({ group_id: g.id, date: addDays(today(), -10), s_1: "absent" }));
    expect(r?.error).toMatch(/oxirgi 3 kun/);
  });
});

describe("admin and finance", () => {
  it("admin logs a call in one step and it is kept in history", async () => {
    await signIn("admin");
    const [a] = await data.absences(addDays(today(), -30), today());
    const r = await staff.logCallAction(undefined, form({ attendance_id: a.attendance_id, outcome: "no_answer" }));
    expect(r?.ok).toBe(true);
    await staff.logCallAction(undefined, form({ attendance_id: a.attendance_id, outcome: "called", note: "Kasal" }));
    const h = await data.callHistory([a.attendance_id]);
    expect(h.slice(0, 2).map((x) => x.outcome)).toEqual(["called", "no_answer"]);
  });

  it("new staff get a generated password and must change it on first login", async () => {
    await signIn("admin");
    const r = await staff.createStaffAction(undefined, form({ name: "Yangi Ustoz", login: "yangi.ustoz", role: "teacher" }));
    expect(r?.secret?.password).toBeTruthy();
    expect(await signIn("yangi.ustoz", r!.secret!.password)).toBe("/teacher");
    expect(await expectRedirect(staff.saveTopicAction(undefined, form({ group_id: 1, date: today(), topic: "x y" })))).toBe("/hisob?yangi=1");
  });

  it("blocking a user signs them out at once", async () => {
    await signIn("ustoz3");
    const token = [...jar.entries()];
    await signIn("admin");
    const [u] = await db.query<{ id: number }>(`select id from users where login = 'ustoz3'`);
    await staff.setUserActiveAction(undefined, form({ user_id: u.id }));
    jar.clear();
    for (const [k, v] of token) jar.set(k, v);
    expect(await expectRedirect(staff.saveTopicAction(undefined, form({ group_id: 1, date: today(), topic: "x y" })))).toBe("/login");
  });

  it("payments are voided with a reason, never deleted", async () => {
    await signIn("moliya");
    const [s] = await data.billing(monthOf(today()));
    const r = await staff.addPaymentAction(
      undefined,
      form({ student_id: s.student_id, amount: "250 000", month: monthOf(today()), paid_at: today(), method: "Click" }),
    );
    expect(r?.ok).toBe(true);
    const [p] = await db.query<{ id: number }>(`select id from payments where amount = 250000 order by id desc limit 1`);
    expect((await staff.voidPaymentAction(undefined, form({ id: p.id, reason: "Xato summa" })))?.ok).toBe(true);
    const [row] = await db.query<{ voided_at: string | null }>(`select voided_at from payments where id = $1`, [p.id]);
    expect(row.voided_at).not.toBeNull();
    expect((await staff.voidPaymentAction(undefined, form({ id: p.id, reason: "Yana" })))?.error).toBeTruthy();
  });

  it("search text cannot change the SQL", async () => {
    expect(await data.listStudents("%' or 1=1 --")).toHaveLength(0);
    expect((await data.listStudents("%")).length).toBe(0);
  });
});
