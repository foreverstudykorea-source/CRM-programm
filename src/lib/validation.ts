import { z } from "zod";

// Every value that reaches the server is parsed here first. Unknown fields are dropped,
// lengths are capped and formats are strict, so nothing unexpected reaches a query.

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const text = (min: number, max: number, msg: string) =>
  z
    .string({ error: msg })
    .trim()
    .min(min, msg)
    .max(max, `${max} belgidan oshmasin`)
    .refine((v) => !CONTROL.test(v), "Ruxsat etilmagan belgi");

/** Empty string → null; otherwise the text rules apply. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} belgidan oshmasin`)
    .refine((v) => !CONTROL.test(v), "Ruxsat etilmagan belgi")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const id = z.coerce.number({ error: "Noto'g'ri ID" }).int().positive().max(2_147_483_647);
const optionalId = z
  .union([z.literal(""), id])
  .nullish()
  .transform((v) => (typeof v === "number" ? v : null));

function validDate(v: string) {
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana noto'g'ri").refine(validDate, "Sana noto'g'ri");
export const isoMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Oy noto'g'ri");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vaqt noto'g'ri");

/** Uzbek and international numbers. Stored as "+998 90 123 45 67". */
export const phone = z
  .string()
  .trim()
  .max(32)
  .transform((v, ctx) => {
    if (v === "") return null;
    let digits = v.replace(/[\s()-]/g, "");
    if (!/^\+?\d{9,15}$/.test(digits)) {
      ctx.addIssue({ code: "custom", message: "Telefon raqami noto'g'ri" });
      return z.NEVER;
    }
    digits = digits.replace(/^\+/, "");
    if (digits.length === 9) digits = "998" + digits;
    if (digits.startsWith("998") && digits.length === 12) {
      const d = digits.slice(3);
      return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
    }
    return "+" + digits;
  })
  .nullable()
  .optional()
  .transform((v) => v ?? null);

export const loginName = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.-]{3,32}$/, "Login 3–32 ta lotin harfi, raqam yoki . _ - dan iborat bo'lsin");

export const ATTENDANCE = ["present", "late", "absent"] as const;
export const CALL_OUTCOMES = ["called", "no_answer", "messaged"] as const;
export const PAYMENT_METHODS = ["Naqd", "Karta", "Click", "Payme", "Bank o'tkazmasi"] as const;
export const GROUP_COLORS = ["indigo", "violet", "rose", "emerald", "amber", "sky"] as const;
export const STAFF_ROLES = ["teacher", "admin", "finance"] as const;

// ------------------------------------------------------------- Schemas ---

export const loginSchema = z.object({
  login: z.string().trim().toLowerCase().min(1, "Loginni kiriting").max(64),
  password: z.string().min(1, "Parolni kiriting").max(128),
});

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Joriy parolni kiriting").max(128),
    next: z.string().max(128),
    confirm: z.string().max(128),
  })
  .refine((v) => v.next === v.confirm, { message: "Yangi parollar bir xil emas", path: ["confirm"] });

export const setupSchema = z
  .object({
    token: z.string().min(1, "Sozlash kalitini kiriting").max(256),
    name: text(3, 80, "Ism-familiyani kiriting"),
    login: loginName,
    password: z.string().max(128),
    confirm: z.string().max(128),
    demo: z.literal("on").optional(),
  })
  .refine((v) => v.password === v.confirm, { message: "Parollar bir xil emas", path: ["confirm"] });

export const attendanceSchema = z.object({
  group_id: id,
  date: isoDate,
  topic: optionalText(200),
  // s_<studentId> = present | late | absent
  statuses: z.record(z.string().regex(/^\d{1,10}$/), z.enum(ATTENDANCE)),
});

export const topicSchema = z.object({ group_id: id, date: isoDate, topic: text(2, 200, "Mavzuni kiriting") });

export const callLogSchema = z.object({
  attendance_id: id,
  outcome: z.enum(CALL_OUTCOMES, { error: "Natijani tanlang" }),
  note: optionalText(500),
});

export const studentSchema = z.object({
  full_name: text(3, 80, "Ism-familiyani kiriting"),
  phone,
  parent_name: optionalText(80),
  parent_phone: phone,
  group_id: optionalId,
  create_login: z.literal("on").optional(),
  login: z.union([z.literal(""), loginName]).optional(),
});

export const groupSchema = z
  .object({
    name: text(2, 60, "Guruh nomini kiriting"),
    subject: text(2, 60, "Fanni kiriting"),
    level: text(1, 60, "Darajani kiriting"),
    room: text(1, 30, "Xonani kiriting"),
    teacher_id: optionalId,
    days: z.array(z.enum(["1", "2", "3", "4", "5", "6", "7"])).min(1, "Kamida bitta kunni tanlang"),
    start_time: time,
    end_time: time,
    monthly_fee: z
      .string()
      .transform((v) => Number(v.replace(/\D/g, "") || "0"))
      .pipe(z.number().int().min(0).max(100_000_000, "Summa juda katta")),
    color: z.enum(GROUP_COLORS).catch("indigo"),
  })
  .refine((v) => v.end_time > v.start_time, { message: "Tugash vaqti boshlanishdan keyin bo'lsin", path: ["end_time"] });

export const paymentSchema = z.object({
  student_id: id,
  amount: z
    .string()
    .transform((v) => Number(v.replace(/\D/g, "") || "0"))
    .pipe(z.number().int().min(1_000, "Summa kamida 1 000 so'm").max(100_000_000, "Summa juda katta")),
  month: isoMonth,
  paid_at: isoDate,
  method: z.enum(PAYMENT_METHODS, { error: "To'lov usulini tanlang" }),
  note: optionalText(300),
});

export const voidPaymentSchema = z.object({ id, reason: text(3, 300, "Bekor qilish sababini yozing") });

export const staffSchema = z.object({
  name: text(3, 80, "Ism-familiyani kiriting"),
  login: loginName,
  role: z.enum(STAFF_ROLES, { error: "Rolni tanlang" }),
  phone,
});

export const userIdSchema = z.object({ user_id: id });

// ------------------------------------------------------------- Helpers ---

export type Parsed<T> = { ok: true; data: T } | { ok: false; error: string; field?: string };

/** FormData → plain object. Repeated keys become arrays; `s_<id>` keys are gathered into `statuses`. */
export function formToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const statuses: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v !== "string") continue; // no file uploads anywhere in this app
    if (k.startsWith("$ACTION")) continue;
    if (k.startsWith("s_")) {
      statuses[k.slice(2)] = v;
      continue;
    }
    if (k in out) out[k] = ([] as unknown[]).concat(out[k], v);
    else out[k] = v;
  }
  if (Object.keys(statuses).length) out.statuses = statuses;
  if (form.getAll("days").length) out.days = form.getAll("days").map(String);
  return out;
}

export function parse<T>(schema: z.ZodType<T>, input: unknown): Parsed<T> {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  const issue = r.error.issues[0];
  return { ok: false, error: issue?.message ?? "Noto'g'ri ma'lumot", field: issue?.path.join(".") };
}

export function parseForm<T>(schema: z.ZodType<T>, form: FormData): Parsed<T> {
  return parse(schema, formToObject(form));
}
