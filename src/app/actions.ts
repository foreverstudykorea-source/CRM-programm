"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, HOME, requireRole, type Role } from "@/lib/auth";
import { q } from "@/lib/db";
import * as data from "@/lib/data";
import { monthOf, today } from "@/lib/dates";
import { hashPassword, verifyPassword } from "@/lib/password";

export type FormState = { ok?: boolean; error?: string; message?: string } | undefined;

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isMonth = (v: string | null): v is string => !!v && /^\d{4}-\d{2}$/.test(v);

// ------------------------------------------------------------------ Auth ---

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const loginName = str(form, "login")?.toLowerCase();
  const password = str(form, "password");
  if (!loginName || !password) return { error: "Login va parolni kiriting" };
  const [user] = await q<{ id: number; role: Role; password_hash: string }>(
    `select id, role, password_hash from users where lower(login) = $1`,
    [loginName],
  );
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Login yoki parol noto'g'ri" };
  }
  await createSession(user.id);
  redirect(HOME[user.role]);
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// --------------------------------------------------------------- Teacher ---

async function assertTeacherOwnsGroup(groupId: number) {
  const user = await requireRole("teacher", "admin");
  const group = await data.getGroup(groupId);
  if (!group) throw new Error("Guruh topilmadi");
  if (user.role === "teacher" && group.teacher_id !== user.id) throw new Error("Bu guruh sizga biriktirilmagan");
  return user;
}

export async function saveAttendanceAction(_: FormState, form: FormData): Promise<FormState> {
  const groupId = Number(str(form, "group_id"));
  const date = str(form, "date");
  if (!groupId || !isDate(date)) return { error: "Noto'g'ri ma'lumot" };
  if (date > today()) return { error: "Kelajakdagi dars uchun davomat belgilab bo'lmaydi" };
  await assertTeacherOwnsGroup(groupId);

  const { rows } = await data.roster(groupId, date);
  const statuses = rows.map((r) => {
    const v = str(form, `s_${r.student_id}`);
    const status = v === "absent" || v === "late" ? v : "present";
    return { studentId: r.student_id, status } as const;
  });
  await data.saveAttendance(groupId, date, str(form, "topic"), statuses);
  revalidatePath("/", "layout");
  const absent = statuses.filter((s) => s.status === "absent").length;
  return {
    ok: true,
    message: absent
      ? `Saqlandi. ${absent} ta kelmagan o'quvchi administratorga yuborildi.`
      : "Saqlandi. Hamma darsda qatnashdi!",
  };
}

export async function saveTopicAction(_: FormState, form: FormData): Promise<FormState> {
  const groupId = Number(str(form, "group_id"));
  const date = str(form, "date");
  const topic = str(form, "topic");
  if (!groupId || !isDate(date) || !topic) return { error: "Mavzuni kiriting" };
  await assertTeacherOwnsGroup(groupId);
  await data.saveTopic(groupId, date, topic);
  revalidatePath("/", "layout");
  return { ok: true, message: "Mavzu saqlandi" };
}

// ----------------------------------------------------------------- Admin ---

const CALL_STATUSES = ["pending", "called", "no_answer", "messaged"];

export async function updateCallAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("admin");
  const attendanceId = Number(str(form, "attendance_id"));
  const status = str(form, "status");
  if (!attendanceId || !status || !CALL_STATUSES.includes(status)) return { error: "Holatni tanlang" };
  await data.updateCall(attendanceId, status, str(form, "note"), user.id);
  revalidatePath("/admin");
  return { ok: true, message: "Saqlandi" };
}

export async function createStudentAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("admin");
  const full_name = str(form, "full_name");
  if (!full_name) return { error: "Ism-familiyani kiriting" };
  const login = str(form, "login")?.toLowerCase() ?? null;
  const password = str(form, "password");
  if (login && !/^[a-z0-9_.-]{3,32}$/.test(login)) return { error: "Login faqat lotin harflari va raqamlardan iborat bo'lsin" };
  if (login && (!password || password.length < 6)) return { error: "Parol kamida 6 belgidan iborat bo'lsin" };
  if (login && (await data.loginExists(login))) return { error: "Bu login band" };
  await data.createStudent({
    full_name,
    phone: str(form, "phone"),
    parent_name: str(form, "parent_name"),
    parent_phone: str(form, "parent_phone"),
    group_id: Number(str(form, "group_id")) || null,
    login,
    password_hash: login && password ? hashPassword(password) : null,
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${full_name} qo'shildi` };
}

export async function createGroupAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("admin");
  const name = str(form, "name");
  const days = form.getAll("days").map(String).filter((d) => /^[1-7]$/.test(d)).sort().join(",");
  const start_time = str(form, "start_time");
  const end_time = str(form, "end_time");
  if (!name || !days || !start_time || !end_time) return { error: "Nomi, kunlari va vaqtini kiriting" };
  await data.createGroup({
    name,
    subject: str(form, "subject") ?? "",
    level: str(form, "level") ?? "",
    room: str(form, "room") ?? "",
    teacher_id: Number(str(form, "teacher_id")) || null,
    days,
    start_time,
    end_time,
    monthly_fee: Number(str(form, "monthly_fee")?.replace(/\D/g, "")) || 0,
    color: str(form, "color") ?? "indigo",
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${name} guruhi yaratildi` };
}

// --------------------------------------------------------------- Finance ---

const METHODS = ["Naqd", "Karta", "Click", "Payme", "Bank o'tkazmasi"];

export async function addPaymentAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("finance");
  const student_id = Number(str(form, "student_id"));
  const amount = Number(str(form, "amount")?.replace(/\D/g, ""));
  const month = str(form, "month") ?? monthOf(today());
  const paid_at = str(form, "paid_at") ?? today();
  const method = str(form, "method") ?? "Naqd";
  if (!student_id) return { error: "O'quvchini tanlang" };
  if (!amount || amount <= 0) return { error: "Summani kiriting" };
  if (!isMonth(month) || !isDate(paid_at) || !METHODS.includes(method)) return { error: "Noto'g'ri ma'lumot" };
  await data.addPayment({ student_id, amount, month, paid_at, method, note: str(form, "note"), created_by: user.id });
  revalidatePath("/finance");
  return { ok: true, message: "To'lov qabul qilindi" };
}

export async function deletePaymentAction(form: FormData) {
  await requireRole("finance");
  const id = Number(str(form, "id"));
  if (id) await data.deletePayment(id);
  revalidatePath("/finance");
}
