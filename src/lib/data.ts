import "server-only";
import { q, tx } from "./db";
import { addDays, addMonths, today, weekday } from "./dates";

export type Group = {
  id: number;
  name: string;
  subject: string;
  level: string;
  room: string;
  teacher_id: number | null;
  teacher_name: string | null;
  days: string;
  start_time: string;
  end_time: string;
  monthly_fee: number;
  color: string;
  student_count: number;
};

const GROUP_SELECT = `
  select g.*, u.name as teacher_name,
    (select count(*)::int from students s where s.group_id = g.id and s.active) as student_count
  from groups g left join users u on u.id = g.teacher_id`;

export async function listGroups(): Promise<Group[]> {
  return q<Group>(`${GROUP_SELECT} order by g.start_time, g.name`);
}

export async function getGroup(id: number): Promise<Group | null> {
  const [g] = await q<Group>(`${GROUP_SELECT} where g.id = $1`, [id]);
  return g ?? null;
}

export async function listTeachers() {
  return q<{ id: number; name: string }>(`select id, name from users where role = 'teacher' and active order by name`);
}

export function groupMeetsOn(group: Pick<Group, "days">, date: string) {
  return group.days.split(",").map(Number).includes(weekday(date));
}

// ---------------------------------------------------------------- Student ---

export type StudentProfile = {
  id: number;
  user_id: number | null;
  full_name: string;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  group_id: number | null;
  joined_at: string;
};

export async function getStudentByUser(userId: number) {
  const [s] = await q<StudentProfile>(`select * from students where user_id = $1 and active`, [userId]);
  if (!s) return null;
  const group = s.group_id ? await getGroup(s.group_id) : null;
  return { student: s, group };
}

export type Lesson = { id: number; group_id: number; date: string; topic: string | null; marked_at: string | null };

export async function lessonsBetween(groupId: number, from: string, to: string) {
  return q<Lesson>(
    `select id, group_id, date, topic, marked_at from lessons where group_id = $1 and date between $2 and $3 order by date`,
    [groupId, from, to],
  );
}

export async function studentAttendance(studentId: number, limit = 12) {
  return q<{ date: string; topic: string | null; status: "present" | "late" | "absent" }>(
    `select l.date, l.topic, a.status from attendance a join lessons l on l.id = a.lesson_id
     where a.student_id = $1 order by l.date desc limit $2`,
    [studentId, limit],
  );
}

export async function studentAttendanceStats(studentId: number) {
  const [r] = await q<{ total: number; present: number; late: number; absent: number }>(
    `select count(*)::int as total,
       count(*) filter (where status = 'present')::int as present,
       count(*) filter (where status = 'late')::int as late,
       count(*) filter (where status = 'absent')::int as absent
     from attendance where student_id = $1`,
    [studentId],
  );
  return r;
}

export async function paidForMonth(studentId: number, month: string) {
  const [r] = await q<{ paid: number }>(
    `select coalesce(sum(amount),0)::int as paid from payments where student_id = $1 and month = $2 and voided_at is null`,
    [studentId, month],
  );
  return r.paid;
}

// ---------------------------------------------------------------- Teacher ---

export type TeacherGroup = Group & {
  lesson_id: number | null;
  marked_at: string | null;
  topic: string | null;
  present: number;
  late: number;
  absent: number;
};

export async function teacherGroups(teacherId: number, date: string) {
  return q<TeacherGroup>(
    `select x.*, l.id as lesson_id, l.marked_at, l.topic,
       (select count(*)::int from attendance a where a.lesson_id = l.id and a.status = 'present') as present,
       (select count(*)::int from attendance a where a.lesson_id = l.id and a.status = 'late') as late,
       (select count(*)::int from attendance a where a.lesson_id = l.id and a.status = 'absent') as absent
     from (${GROUP_SELECT} where g.teacher_id = $1) x
     left join lessons l on l.group_id = x.id and l.date = $2
     order by x.start_time`,
    [teacherId, date],
  );
}

export type RosterRow = {
  student_id: number;
  full_name: string;
  status: "present" | "late" | "absent" | null;
  rate: number | null;
};

export async function roster(groupId: number, date: string) {
  const [lesson] = await q<Lesson>(
    `select id, group_id, date, topic, marked_at from lessons where group_id = $1 and date = $2`,
    [groupId, date],
  );
  const rows = await q<RosterRow>(
    `select s.id as student_id, s.full_name, a.status,
       (select round(100.0 * count(*) filter (where a2.status <> 'absent') / nullif(count(*), 0))::int
          from attendance a2 where a2.student_id = s.id) as rate
     from students s
     left join attendance a on a.student_id = s.id and a.lesson_id = $2
     where s.group_id = $1 and s.active
     order by s.full_name`,
    [groupId, lesson?.id ?? -1],
  );
  return { lesson: lesson ?? null, rows };
}

export async function saveAttendance(
  groupId: number,
  date: string,
  topic: string | null,
  statuses: { studentId: number; status: "present" | "absent" | "late" }[],
) {
  return tx(async (db) => {
    const [lesson] = await db.query<{ id: number }>(
      `insert into lessons (group_id, date, topic, marked_at) values ($1, $2, $3, now())
       on conflict (group_id, date) do update set topic = coalesce(excluded.topic, lessons.topic), marked_at = now()
       returning id`,
      [groupId, date, topic],
    );
    const before = await db.query<{ student_id: number; status: string }>(
      `select student_id, status from attendance where lesson_id = $1`,
      [lesson.id],
    );
    for (const s of statuses) {
      await db.query(
        `insert into attendance (lesson_id, student_id, status) values ($1, $2, $3)
         on conflict (lesson_id, student_id) do update set status = excluded.status`,
        [lesson.id, s.studentId, s.status],
      );
    }
    const prev = new Map(before.map((b) => [b.student_id, b.status]));
    const changed = statuses.filter((s) => prev.has(s.studentId) && prev.get(s.studentId) !== s.status);
    return { lessonId: lesson.id, firstTime: before.length === 0, changed };
  });
}

export async function saveTopic(groupId: number, date: string, topic: string) {
  await q(
    `insert into lessons (group_id, date, topic) values ($1, $2, $3)
     on conflict (group_id, date) do update set topic = excluded.topic`,
    [groupId, date, topic],
  );
}

// ------------------------------------------------------------------ Admin ---

export async function adminStats(date: string) {
  const [r] = await q<{ students: number; groups: number; absent_today: number; pending_calls: number; resolved_week: number }>(
    `select
       (select count(*)::int from students where active) as students,
       (select count(*)::int from groups) as groups,
       (select count(*)::int from attendance a join lessons l on l.id = a.lesson_id
          where l.date = $1 and a.status = 'absent') as absent_today,
       (select count(*)::int from attendance a join lessons l on l.id = a.lesson_id
          left join calls c on c.attendance_id = a.id
          where a.status = 'absent' and l.date >= $2 and (c.id is null or c.status = 'no_answer')) as pending_calls,
       (select count(*)::int from attendance a join lessons l on l.id = a.lesson_id
          join calls c on c.attendance_id = a.id
          where a.status = 'absent' and l.date >= $2 and c.status in ('called','messaged')) as resolved_week`,
    [date, addDays(date, -6)],
  );
  return r;
}

export type Absence = {
  attendance_id: number;
  date: string;
  student_id: number;
  full_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  phone: string | null;
  group_name: string;
  group_color: string;
  start_time: string;
  call_status: "pending" | "called" | "no_answer" | "messaged";
  note: string | null;
  updated_at: string | null;
  updated_by_name: string | null;
  attempts: number;
  absences_30d: number;
};

export async function absences(from: string, to: string) {
  return q<Absence>(
    `select a.id as attendance_id, l.date, s.id as student_id, s.full_name, s.phone, s.parent_name, s.parent_phone,
       g.name as group_name, g.color as group_color, g.start_time,
       coalesce(c.status, 'pending') as call_status, c.note, c.updated_at::text as updated_at, u.name as updated_by_name,
       (select count(*)::int from call_logs cl where cl.attendance_id = a.id) as attempts,
       (select count(*)::int from attendance a2 join lessons l2 on l2.id = a2.lesson_id
          where a2.student_id = s.id and a2.status = 'absent' and l2.date >= $3) as absences_30d
     from attendance a
     join lessons l on l.id = a.lesson_id
     join students s on s.id = a.student_id
     join groups g on g.id = l.group_id
     left join calls c on c.attendance_id = a.id
     left join users u on u.id = c.updated_by
     where a.status = 'absent' and l.date between $1 and $2
     order by l.date desc, g.start_time, s.full_name`,
    [from, to, addDays(to, -30)],
  );
}

export async function frequentAbsentees(to: string, limit = 5) {
  return q<{ student_id: number; full_name: string; group_name: string | null; n: number; parent_phone: string | null }>(
    `select s.id as student_id, s.full_name, g.name as group_name, s.parent_phone, count(*)::int as n
     from attendance a join lessons l on l.id = a.lesson_id join students s on s.id = a.student_id
     left join groups g on g.id = s.group_id
     where a.status = 'absent' and l.date > $1 and s.active
     group by s.id, g.name having count(*) >= 2 order by n desc, s.full_name limit $2`,
    [addDays(to, -30), limit],
  );
}

export async function callHistory(attendanceIds: number[]) {
  if (!attendanceIds.length) return [];
  return q<{ attendance_id: number; outcome: string; note: string | null; created_at: string; by_name: string | null }>(
    `select cl.attendance_id, cl.outcome, cl.note, cl.created_at::text as created_at, u.name as by_name
     from call_logs cl left join users u on u.id = cl.created_by
     where cl.attendance_id = any($1::int[]) order by cl.created_at desc`,
    [attendanceIds],
  );
}

export async function getAbsence(attendanceId: number) {
  const [r] = await q<{ id: number; status: string; student_id: number; full_name: string }>(
    `select a.id, a.status, s.id as student_id, s.full_name from attendance a join students s on s.id = a.student_id where a.id = $1`,
    [attendanceId],
  );
  return r ?? null;
}

export async function logCall(attendanceId: number, outcome: string, note: string | null, userId: number) {
  await tx(async (db) => {
    await db.query(`insert into call_logs (attendance_id, outcome, note, created_by) values ($1, $2, $3, $4)`, [
      attendanceId,
      outcome,
      note,
      userId,
    ]);
    await db.query(
      `insert into calls (attendance_id, status, note, updated_by, updated_at) values ($1, $2, $3, $4, now())
       on conflict (attendance_id) do update set status = excluded.status,
         note = coalesce(excluded.note, calls.note), updated_by = excluded.updated_by, updated_at = now()`,
      [attendanceId, outcome, note, userId],
    );
  });
}

export async function lessonsOnDate(date: string) {
  return q<Group & { lesson_id: number | null; marked_at: string | null; topic: string | null; absent: number; marked: number }>(
    `select x.*, l.id as lesson_id, l.marked_at, l.topic,
       (select count(*)::int from attendance a where a.lesson_id = l.id and a.status = 'absent') as absent,
       (select count(*)::int from attendance a where a.lesson_id = l.id) as marked
     from (${GROUP_SELECT}) x
     left join lessons l on l.group_id = x.id and l.date = $1
     where position($2 in x.days) > 0
     order by x.start_time`,
    [date, String(weekday(date))],
  );
}

export type StudentRow = StudentProfile & {
  group_name: string | null;
  group_color: string | null;
  login: string | null;
  has_password: boolean | null;
  rate: number | null;
};

export async function listStudents(search?: string, groupId?: number) {
  const params: unknown[] = [];
  const where: string[] = ["s.active"];
  if (search) {
    // The search text is a bound parameter; LIKE wildcards in it are escaped.
    params.push(`%${search.toLowerCase().replace(/[\\%_]/g, (c) => "\\" + c)}%`);
    where.push(
      `(lower(s.full_name) like $${params.length} or s.phone like $${params.length} or s.parent_phone like $${params.length})`,
    );
  }
  if (groupId) {
    params.push(groupId);
    where.push(`s.group_id = $${params.length}`);
  }
  return q<StudentRow>(
    `select s.*, g.name as group_name, g.color as group_color, u.login, (u.password_hash is not null) as has_password,
       (select round(100.0 * count(*) filter (where a.status <> 'absent') / nullif(count(*), 0))::int
          from attendance a where a.student_id = s.id) as rate
     from students s
     left join groups g on g.id = s.group_id left join users u on u.id = s.user_id
     where ${where.join(" and ")} order by s.full_name limit 500`,
    params,
  );
}

export async function createStudent(input: {
  full_name: string;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  group_id: number | null;
  login: string | null;
  password_hash: string | null;
}) {
  return tx(async (db) => {
    let userId: number | null = null;
    if (input.login && input.password_hash) {
      const [u] = await db.query<{ id: number }>(
        `insert into users (name, login, password_hash, role, phone, must_change_password)
         values ($1, $2, $3, 'student', $4, true) returning id`,
        [input.full_name, input.login, input.password_hash, input.phone],
      );
      userId = u.id;
    }
    const [s] = await db.query<{ id: number }>(
      `insert into students (user_id, full_name, phone, parent_name, parent_phone, group_id, joined_at)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [userId, input.full_name, input.phone, input.parent_name, input.parent_phone, input.group_id, today()],
    );
    return { studentId: s.id, userId };
  });
}

export async function loginExists(login: string) {
  const r = await q(`select 1 from users where lower(login) = lower($1)`, [login]);
  return r.length > 0;
}

export async function createGroup(input: {
  name: string;
  subject: string;
  level: string;
  room: string;
  teacher_id: number | null;
  days: string;
  start_time: string;
  end_time: string;
  monthly_fee: number;
  color: string;
}) {
  const [g] = await q<{ id: number }>(
    `insert into groups (name, subject, level, room, teacher_id, days, start_time, end_time, monthly_fee, color)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
    [
      input.name,
      input.subject,
      input.level,
      input.room,
      input.teacher_id,
      input.days,
      input.start_time,
      input.end_time,
      input.monthly_fee,
      input.color,
    ],
  );
  return g.id;
}

// ------------------------------------------------------------ Staff/users ---

export type StaffRow = {
  id: number;
  name: string;
  login: string;
  role: "teacher" | "admin" | "finance";
  phone: string | null;
  active: boolean;
  has_password: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  sessions: number;
};

export async function listStaff() {
  return q<StaffRow>(
    `select u.id, u.name, u.login, u.role, u.phone, u.active, (u.password_hash is not null) as has_password,
       u.must_change_password, u.last_login_at::text as last_login_at,
       (select count(*)::int from sessions s where s.user_id = u.id and s.expires_at > now()) as sessions
     from users u where u.role <> 'student'
     order by case u.role when 'admin' then 0 when 'finance' then 1 else 2 end, u.name`,
  );
}

export async function getUserBrief(id: number) {
  const [u] = await q<{ id: number; name: string; login: string; role: string; active: boolean }>(
    `select id, name, login, role, active from users where id = $1`,
    [id],
  );
  return u ?? null;
}

export async function activeAdminCount() {
  const [r] = await q<{ n: number }>(
    `select count(*)::int as n from users where role = 'admin' and active and password_hash is not null`,
  );
  return r.n;
}

export type AuditRow = {
  id: number;
  at: string;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
};

export async function auditLog(filter: { action?: string; limit?: number }) {
  const params: unknown[] = [];
  let where = "";
  if (filter.action) {
    params.push(filter.action + "%");
    where = `where action like $1`;
  }
  params.push(filter.limit ?? 200);
  return q<AuditRow>(
    `select id, at::text as at, actor_name, actor_role, action, entity, entity_id, details, ip
     from audit_log ${where} order by at desc, id desc limit $${params.length}`,
    params,
  );
}

export async function sessionsForUser(userId: number) {
  return q<{ id: string; created_at: string; last_seen_at: string; ip: string | null; user_agent: string | null }>(
    `select id, created_at::text as created_at, last_seen_at::text as last_seen_at, ip, user_agent
     from sessions where user_id = $1 and expires_at > now() order by last_seen_at desc`,
    [userId],
  );
}

// ---------------------------------------------------------------- Finance ---

export type BillingRow = {
  student_id: number;
  full_name: string;
  parent_phone: string | null;
  group_name: string | null;
  fee: number;
  paid: number;
};

export async function billing(month: string) {
  return q<BillingRow>(
    `select s.id as student_id, s.full_name, s.parent_phone, g.name as group_name,
       coalesce(g.monthly_fee, 0)::int as fee,
       coalesce((select sum(p.amount) from payments p
                 where p.student_id = s.id and p.month = $1 and p.voided_at is null), 0)::int as paid
     from students s left join groups g on g.id = s.group_id
     where s.active order by s.full_name`,
    [month],
  );
}

export async function monthlyTotals(month: string, count = 6) {
  const from = addMonths(month, -(count - 1));
  const rows = await q<{ month: string; total: number }>(
    `select month, sum(amount)::int as total from payments
     where month between $1 and $2 and voided_at is null group by month`,
    [from, month],
  );
  const map = new Map(rows.map((r) => [r.month, r.total]));
  return Array.from({ length: count }, (_, i) => {
    const m = addMonths(from, i);
    return { month: m, total: map.get(m) ?? 0 };
  });
}

export async function methodTotals(month: string) {
  return q<{ method: string; total: number; n: number }>(
    `select method, sum(amount)::int as total, count(*)::int as n from payments
     where month = $1 and voided_at is null group by method order by total desc`,
    [month],
  );
}

export type Payment = {
  id: number;
  student_id: number;
  full_name: string;
  group_name: string | null;
  amount: number;
  month: string;
  paid_at: string;
  method: string;
  note: string | null;
  created_by_name: string | null;
  voided_at: string | null;
  void_reason: string | null;
};

export async function recentPayments(month: string, limit = 100) {
  return q<Payment>(
    `select p.id, p.student_id, s.full_name, g.name as group_name, p.amount, p.month, p.paid_at, p.method, p.note,
       u.name as created_by_name, p.voided_at::text as voided_at, p.void_reason
     from payments p join students s on s.id = p.student_id
     left join groups g on g.id = s.group_id left join users u on u.id = p.created_by
     where p.month = $1 order by p.paid_at desc, p.id desc limit $2`,
    [month, limit],
  );
}

export async function studentExists(id: number) {
  const r = await q(`select 1 from students where id = $1 and active`, [id]);
  return r.length > 0;
}

export async function addPayment(input: {
  student_id: number;
  amount: number;
  month: string;
  paid_at: string;
  method: string;
  note: string | null;
  created_by: number;
}) {
  const [p] = await q<{ id: number }>(
    `insert into payments (student_id, amount, month, paid_at, method, note, created_by)
     values ($1,$2,$3,$4,$5,$6,$7) returning id`,
    [input.student_id, input.amount, input.month, input.paid_at, input.method, input.note, input.created_by],
  );
  return p.id;
}

/** Payments are never deleted: they are marked void with a reason, and the audit log keeps who did it. */
export async function voidPayment(id: number, reason: string, userId: number) {
  const [p] = await q<{ id: number; amount: number; student_id: number; month: string }>(
    `update payments set voided_at = now(), voided_by = $2, void_reason = $3
     where id = $1 and voided_at is null returning id, amount, student_id, month`,
    [id, userId, reason],
  );
  return p ?? null;
}
