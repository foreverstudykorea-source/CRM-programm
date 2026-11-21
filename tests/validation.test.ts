import { describe, expect, it } from "vitest";
import {
  attendanceSchema,
  formToObject,
  groupSchema,
  loginSchema,
  parse,
  parseForm,
  paymentSchema,
  phone,
  studentSchema,
} from "@/lib/validation";

const fd = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of [v].flat()) f.append(k, x);
  return f;
};

describe("validation", () => {
  it("normalises Uzbek phone numbers", () => {
    expect(phone.parse("+998901234567")).toBe("+998 90 123 45 67");
    expect(phone.parse("90 123-45-67")).toBe("+998 90 123 45 67");
    expect(phone.parse("")).toBeNull();
    expect(phone.safeParse("call me maybe").success).toBe(false);
    expect(phone.safeParse("+998 90 123 45 67'; drop table users;--").success).toBe(false);
  });

  it("gathers attendance statuses and rejects unknown values", () => {
    const ok = parseForm(attendanceSchema, fd({ group_id: "3", date: "2026-11-20", s_5: "absent", s_6: "present" }));
    expect(ok.ok && ok.data.statuses).toEqual({ "5": "absent", "6": "present" });

    const bad = parseForm(attendanceSchema, fd({ group_id: "3", date: "2026-11-20", s_5: "deleted" }));
    expect(bad.ok).toBe(false);
    const badId = parseForm(attendanceSchema, fd({ group_id: "1 or 1=1", date: "2026-11-20", s_5: "absent" }));
    expect(badId.ok).toBe(false);
    const badDate = parseForm(attendanceSchema, fd({ group_id: "3", date: "2026-02-30", s_5: "absent" }));
    expect(badDate.ok).toBe(false);
  });

  it("caps lengths and strips control characters", () => {
    expect(parse(loginSchema, { login: "a".repeat(65), password: "x" }).ok).toBe(false);
    const r = parse(studentSchema, { full_name: "Ali\u0000 Valiyev" });
    expect(r.ok).toBe(false);
    const minimal = parse(studentSchema, { full_name: "Ali Valiyev" });
    expect(minimal).toMatchObject({ ok: true, data: { phone: null, parent_name: null, group_id: null } });
  });

  it("validates payment amounts and methods", () => {
    const base = { student_id: "1", month: "2026-11", paid_at: "2026-11-20", method: "Naqd" };
    expect(parse(paymentSchema, { ...base, amount: "500 000" })).toMatchObject({ ok: true, data: { amount: 500000 } });
    expect(parse(paymentSchema, { ...base, amount: "-5" }).ok).toBe(false);
    expect(parse(paymentSchema, { ...base, amount: "999999999999" }).ok).toBe(false);
    expect(parse(paymentSchema, { ...base, amount: "1000", method: "Bitcoin" }).ok).toBe(false);
    expect(parse(paymentSchema, { ...base, amount: "1000", month: "2026-13" }).ok).toBe(false);
  });

  it("checks group times and days", () => {
    const g = { name: "IELTS", subject: "Ingliz", level: "B2", room: "201", start_time: "10:00", end_time: "11:30", monthly_fee: "500000" };
    expect(parseForm(groupSchema, fd({ ...g, days: ["1", "3"] })).ok).toBe(true);
    expect(parseForm(groupSchema, fd({ ...g, days: ["8"] })).ok).toBe(false);
    expect(parseForm(groupSchema, fd({ ...g, days: ["1"], end_time: "09:00" })).ok).toBe(false);
  });

  it("ignores Next.js internal fields", () => {
    expect(formToObject(fd({ $ACTION_ID_abc: "x", a: "1" }))).toEqual({ a: "1" });
  });
});
