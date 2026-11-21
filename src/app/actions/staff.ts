"use server";

import { revalidatePath } from "next/cache";
import { audit, getSession, requireRole } from "@/lib/auth";
import { getDb, q } from "@/lib/db";
import * as data from "@/lib/data";
import { addDays, today } from "@/lib/dates";
import { done, fail, type FormState } from "@/lib/form-state";
import { generatePassword, hashPassword } from "@/lib/password";
import { revokeUserSessions } from "@/lib/security";
import {
  attendanceSchema,
  callLogSchema,
  groupSchema,
  parseForm,
  paymentSchema,
  staffSchema,
  studentSchema,
  topicSchema,
  userIdSchema,
  voidPaymentSchema,
} from "@/lib/validation";
import { addMonths, monthOf } from "@/lib/dates";

/** Teachers may correct attendance for this many days back; admins for any date. */
const TEACHER_EDIT_DAYS = 3;

// --------------------------------------------------------------- Teacher ---

async function authorizeGroup(
  groupId: number,
  date: string,
): Promise<{ ok: false; error: string } | { ok: true; user: Awaited<ReturnType<typeof requireRole>>; group: data.Group }> {
  const user = await requireRole("teacher", "admin");
  const group = await data.getGroup(groupId);
  if (!group) return { ok: false, error: "Guruh topilmadi" };
  if (user.role === "teacher" && group.teacher_id !== user.id) {
    await audit(user, { action: "security.denied", entity: "group", entityId: groupId, details: { reason: "not owner" } });
    return { ok: false, error: "Bu guruh sizga biriktirilmagan" };
  }
  const t = today();
  if (date > t) return { ok: false, error: "Kelajakdagi dars uchun belgilab bo'lmaydi" };
  if (user.role === "teacher" && date < addDays(t, -TEACHER_EDIT_DAYS)) {
    return { ok: false, error: `Faqat oxirgi ${TEACHER_EDIT_DAYS} kun ichidagi darslarni o'zgartirish mumkin. Administratorga murojaat qiling.` };
  }
  return { ok: true, user, group };
}

export async function saveAttendanceAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = parseForm(attendanceSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const { group_id, date, topic, statuses } = parsed.data;
  const auth = await authorizeGroup(group_id, date);
  if (!auth.ok) return fail(auth.error);

  const { lesson, rows } = await data.roster(group_id, date);
  if (!lesson && !data.groupMeetsOn(auth.group, date)) return fail("Bu kunda guruhning darsi yo'q");

  // Only students who really belong to this group are written; anything else in the form is ignored.
  const list = rows
    .filter((r) => statuses[String(r.student_id)])
    .map((r) => ({ studentId: r.student_id, status: statuses[String(r.student_id)] }));
  if (!list.length) return fail("Hech bir o'quvchi belgilanmadi");

  const res = await data.saveAttendance(group_id, date, topic, list);
  const absent = list.filter((s) => s.status === "absent").length;
  await audit(auth.user, {
    action: res.firstTime ? "attendance.marked" : "attendance.corrected",
    entity: "lesson",
    entityId: res.lessonId,
    details: {
      group: auth.group.name,
      date,
      present: list.filter((s) => s.status === "present").length,
      late: list.filter((s) => s.status === "late").length,
      absent,
      changed: res.changed.length ? res.changed : undefined,
    },
  });
  revalidatePath("/", "layout");
  return done(
    absent
      ? `Saqlandi. ${absent} ta kelmagan o'quvchi administratorga qo'ng'iroq uchun yuborildi.`
      : "Saqlandi. Hamma darsda!",
  );
}

export async function saveTopicAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = parseForm(topicSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const { group_id, date, topic } = parsed.data;
  // Topics can be planned ahead, so only ownership is checked here.
  const user = await requireRole("teacher", "admin");
  const group = await data.getGroup(group_id);
  if (!group || (user.role === "teacher" && group.teacher_id !== user.id)) return fail("Bu guruh sizga biriktirilmagan");
  if (date < addDays(today(), -TEACHER_EDIT_DAYS) && user.role === "teacher") return fail("Eski darsni o'zgartirib bo'lmaydi");
  await data.saveTopic(group_id, date, topic);
  await audit(user, { action: "lesson.topic", entity: "group", entityId: group_id, details: { date, topic } });
  revalidatePath("/", "layout");
  return done("Mavzu saqlandi");
}

// ----------------------------------------------------------------- Admin ---

const OUTCOME_LABEL = { called: "Gaplashildi", no_answer: "Javob bermadi", messaged: "Xabar yuborildi" } as const;

export async function logCallAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("admin");
  const parsed = parseForm(callLogSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const { attendance_id, outcome, note } = parsed.data;
  const absence = await data.getAbsence(attendance_id);
  if (!absence || absence.status !== "absent") return fail("Bu yozuv kelmaganlar ro'yxatida emas");
  await data.logCall(attendance_id, outcome, note, user.id);
  await audit(user, {
    action: "call.logged",
    entity: "attendance",
    entityId: attendance_id,
    details: { student: absence.full_name, outcome, note: note ?? undefined },
  });
  revalidatePath("/admin");
  return done(`${absence.full_name}: ${OUTCOME_LABEL[outcome]}`);
}

export async function createStudentAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("admin");
  const parsed = parseForm(studentSchema, form);
  if (!parsed.ok) return fail(parsed.error, parsed.field);
  const v = parsed.data;
  if (v.group_id && !(await data.getGroup(v.group_id))) return fail("Guruh topilmadi", "group_id");

  let login: string | null = null;
  let password: string | null = null;
  if (v.create_login) {
    if (!v.login) return fail("Login kiriting", "login");
    if (await data.loginExists(v.login)) return fail("Bu login band", "login");
    login = v.login;
    password = generatePassword();
  }
  const res = await data.createStudent({
    full_name: v.full_name,
    phone: v.phone,
    parent_name: v.parent_name,
    parent_phone: v.parent_phone,
    group_id: v.group_id,
    login,
    password_hash: password ? await hashPassword(password) : null,
  });
  await audit(user, {
    action: "student.created",
    entity: "student",
    entityId: res.studentId,
    details: { name: v.full_name, login: login ?? undefined },
  });
  revalidatePath("/admin", "layout");
  return done(`${v.full_name} qo'shildi`, login && password ? { secret: { login, password, name: v.full_name } } : {});
}

export async function createGroupAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("admin");
  const parsed = parseForm(groupSchema, form);
  if (!parsed.ok) return fail(parsed.error, parsed.field);
  const v = parsed.data;
  if (v.teacher_id) {
    const t = await data.getUserBrief(v.teacher_id);
    if (!t || t.role !== "teacher") return fail("Ustoz topilmadi", "teacher_id");
  }
  const id = await data.createGroup({ ...v, days: [...v.days].sort().join(",") });
  await audit(user, { action: "group.created", entity: "group", entityId: id, details: { name: v.name } });
  revalidatePath("/admin", "layout");
  return done(`${v.name} guruhi yaratildi`);
}

export async function createStaffAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("admin");
  const parsed = parseForm(staffSchema, form);
  if (!parsed.ok) return fail(parsed.error, parsed.field);
  const v = parsed.data;
  if (await data.loginExists(v.login)) return fail("Bu login band", "login");
  const password = generatePassword();
  const [row] = await q<{ id: number }>(
    `insert into users (name, login, password_hash, role, phone, must_change_password) values ($1,$2,$3,$4,$5,true) returning id`,
    [v.name, v.login, await hashPassword(password), v.role, v.phone],
  );
  await audit(user, { action: "user.created", entity: "user", entityId: row.id, details: { login: v.login, role: v.role } });
  revalidatePath("/admin/xodimlar");
  return done(`${v.name} qo'shildi`, { secret: { login: v.login, password, name: v.name } });
}

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("admin");
  const parsed = parseForm(userIdSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const target = await data.getUserBrief(parsed.data.user_id);
  if (!target) return fail("Foydalanuvchi topilmadi");
  if (target.id === user.id) return fail("O'z parolingizni \"Hisob\" sahifasida almashtiring");
  const password = generatePassword();
  await q(`update users set password_hash = $1, must_change_password = true, password_changed_at = now() where id = $2`, [
    await hashPassword(password),
    target.id,
  ]);
  await revokeUserSessions(await getDb(), target.id);
  await audit(user, { action: "user.password_reset", entity: "user", entityId: target.id, details: { login: target.login } });
  revalidatePath("/admin", "layout");
  return done("Yangi vaqtinchalik parol yaratildi", { secret: { login: target.login, password, name: target.name } });
}

export async function setUserActiveAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("admin");
  const parsed = parseForm(userIdSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const target = await data.getUserBrief(parsed.data.user_id);
  if (!target) return fail("Foydalanuvchi topilmadi");
  if (target.id === user.id) return fail("O'zingizni bloklay olmaysiz");
  const activate = !target.active;
  await q(`update users set active = $1 where id = $2`, [activate, target.id]);
  if (!activate) await revokeUserSessions(await getDb(), target.id);
  await audit(user, {
    action: activate ? "user.unblocked" : "user.blocked",
    entity: "user",
    entityId: target.id,
    details: { login: target.login },
  });
  revalidatePath("/admin", "layout");
  return done(activate ? `${target.name} faollashtirildi` : `${target.name} bloklandi va tizimdan chiqarildi`);
}

export async function revokeSessionsAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("admin");
  const parsed = parseForm(userIdSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const target = await data.getUserBrief(parsed.data.user_id);
  if (!target) return fail("Foydalanuvchi topilmadi");
  const own = target.id === user.id ? (await getSession())?.id : undefined;
  await revokeUserSessions(await getDb(), target.id, own);
  await audit(user, { action: "user.sessions_revoked", entity: "user", entityId: target.id, details: { login: target.login } });
  revalidatePath("/admin/xodimlar");
  return done(`${target.name}: barcha qurilmalardan chiqarildi`);
}

// --------------------------------------------------------------- Finance ---

export async function addPaymentAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("finance");
  const parsed = parseForm(paymentSchema, form);
  if (!parsed.ok) return fail(parsed.error, parsed.field);
  const v = parsed.data;
  const t = today();
  const current = monthOf(t);
  if (v.paid_at > t) return fail("To'lov sanasi kelajakda bo'lishi mumkin emas", "paid_at");
  if (v.month < addMonths(current, -12) || v.month > addMonths(current, 3)) return fail("Oy noto'g'ri", "month");
  if (!(await data.studentExists(v.student_id))) return fail("O'quvchi topilmadi", "student_id");
  const id = await data.addPayment({ ...v, created_by: user.id });
  await audit(user, {
    action: "payment.added",
    entity: "payment",
    entityId: id,
    details: { student_id: v.student_id, amount: v.amount, month: v.month, method: v.method },
  });
  revalidatePath("/finance", "layout");
  return done("To'lov qabul qilindi");
}

export async function voidPaymentAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("finance");
  const parsed = parseForm(voidPaymentSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const p = await data.voidPayment(parsed.data.id, parsed.data.reason, user.id);
  if (!p) return fail("To'lov topilmadi yoki allaqachon bekor qilingan");
  await audit(user, {
    action: "payment.voided",
    entity: "payment",
    entityId: p.id,
    details: { amount: p.amount, student_id: p.student_id, month: p.month, reason: parsed.data.reason },
  });
  revalidatePath("/finance", "layout");
  return done("To'lov bekor qilindi");
}
