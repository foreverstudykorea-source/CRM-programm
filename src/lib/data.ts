import "server-only";
import { q } from "./db";
import { addDays, addMonths, today } from "./dates";

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
  return q<{ id: number; name: string }>(`select id, name from users where role = 'teacher' order by name`);
}

// ---------------------------------------------------------------- Student ---

export type StudentProfile = {
  id: number;
  full_name: string;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  group_id: number | null;
  joined_at: string;
};

export async function getStudentByUser(userId: number) {
  const [s] = await q<StudentProfile>(`select * from students where user_id = $1`, [userId]);
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
  return q<{ date: string; topic: string | null; status: string }>(
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
    `select coalesce(sum(amount),0)::int as paid from payments where student_id = $1 and month = $2`,
    [studentId, month],
  );
  return r.paid;
}

// ---------------------------------------------------------------- Teacher ---

export type TeacherGroup = Group & { today_lesson_id: number | null; today_marked: string | null; today_topic: string | null };

export async function teacherGroups(teacherId: number, date: string) {
  return q<TeacherGroup>(
    `select x.*, l.id as today_lesson_id, l.marked_at as today_marked, l.topic as today_topic
     from (${GROUP_SELECT} where g.teacher_id = $1) x
     left join lessons l on l.group_id = x.id and l.date = $2
     order by x.start_time`,
    [teacherId, date],
  );
}

export type RosterRow = { student_id: number; full_name: string; status: string | null; parent_phone: string | null };

export async function roster(groupId: number, date: string) {
  const [lesson] = await q<Lesson>(
    `select id, group_id, date, topic, marked_at from lessons where group_id = $1 and date = $2`,
    [groupId, date],
  );
  const rows = await q<RosterRow>(
    `select s.id as student_id, s.full_name, s.parent_phone, a.status
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
  const [lesson] = await q<{ id: number }>(
    `insert into lessons (group_id, date, topic, marked_at) values ($1, $2, $3, now())
     on conflict (group_id, date) do update set topic = coalesce(excluded.topic, lessons.topic), marked_at = now()
     returning id`,
    [groupId, date, topic],
  );
  for (const s of statuses) {
    await q(
      `insert into attendance (lesson_id, student_id, status) values ($1, $2, $3)
       on conflict (lesson_id, student_id) do update set status = excluded.status`,
      [lesson.id, s.studentId, s.status],
    );
  }
  return lesson.id;
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
  const [r] = await q<{ students: number; groups: number; absent_today: number; pending_calls: number }>(
    `select
       (select count(*)::int from students where active) as students,
       (select count(*)::int from groups) as groups,
       (select count(*)::int from attendance a join lessons l on l.id = a.lesson_id
          where l.date = $1 and a.status = 'absent') as absent_today,
       (select count(*)::int from attendance a join lessons l on l.id = a.lesson_id
          left join calls c on c.attendance_id = a.id
          where a.status = 'absent' and l.date >= $2 and (c.id is null or c.status in ('pending','no_answer'))) as pending_calls`,
    [date, addDays(date, -6)],
  );
  return r;
}

export type Absence = {
  attendance_id: number;
  date: string;
  student_id: number;
  full_name: string;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  group_name: string;
  start_time: string;
  call_status: "pending" | "called" | "no_answer" | "messaged";
  note: string | null;
  updated_at: string | null;
  updated_by_name: string | null;
  absences_30d: number;
};

export async function absences(from: string, to: string) {
  return q<Absence>(
    `select a.id as attendance_id, l.date, s.id as student_id, s.full_name, s.phone, s.parent_name, s.parent_phone,
       g.name as group_name, g.start_time,
       coalesce(c.status, 'pending') as call_status, c.note, c.updated_at::text as updated_at, u.name as updated_by_name,
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

export async function updateCall(attendanceId: number, status: string, note: string | null, userId: number) {
  await q(
    `insert into calls (attendance_id, status, note, updated_by, updated_at) values ($1, $2, $3, $4, now())
     on conflict (attendance_id) do update set status = excluded.status, note = excluded.note,
       updated_by = excluded.updated_by, updated_at = now()`,
    [attendanceId, status, note, userId],
  );
}

export async function lessonsOnDate(date: string) {
  return q<Group & { lesson_id: number | null; marked_at: string | null; topic: string | null; absent: number }>(
    `select x.*, l.id as lesson_id, l.marked_at, l.topic,
       (select count(*)::int from attendance a where a.lesson_id = l.id and a.status = 'absent') as absent
     from (${GROUP_SELECT}) x
     left join lessons l on l.group_id = x.id and l.date = $1
     where position($2 in x.days) > 0
     order by x.start_time`,
    [date, String(isoWeekday(date))],
  );
}

function isoWeekday(iso: string) {
  const d = new Date(iso + "T00:00:00Z").getUTCDay();
  return d === 0 ? 7 : d;
}

export type StudentRow = StudentProfile & { group_name: string | null; login: string | null; active: boolean };

export async function listStudents(search?: string, groupId?: number) {
  const params: unknown[] = [];
  const where: string[] = ["s.active"];
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(lower(s.full_name) like $${params.length} or s.phone like $${params.length} or s.parent_phone like $${params.length})`);
  }
  if (groupId) {
    params.push(groupId);
    where.push(`s.group_id = $${params.length}`);
  }
  return q<StudentRow>(
    `select s.*, g.name as group_name, u.login from students s
     left join groups g on g.id = s.group_id left join users u on u.id = s.user_id
     where ${where.join(" and ")} order by s.full_name`,
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
  let userId: number | null = null;
  if (input.login && input.password_hash) {
    const [u] = await q<{ id: number }>(
      `insert into users (name, login, password_hash, role, phone) values ($1, $2, $3, 'student', $4) returning id`,
      [input.full_name, input.login, input.password_hash, input.phone],
    );
    userId = u.id;
  }
  await q(
    `insert into students (user_id, full_name, phone, parent_name, parent_phone, group_id, joined_at)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, input.full_name, input.phone, input.parent_name, input.parent_phone, input.group_id, today()],
  );
}

export async function loginExists(login: string) {
  const r = await q(`select 1 from users where login = $1`, [login]);
  return r.length > 0;
}

export async function createGroup(input: {
  name: string; subject: string; level: string; room: string; teacher_id: number | null;
  days: string; start_time: string; end_time: string; monthly_fee: number; color: string;
}) {
  await q(
    `insert into groups (name, subject, level, room, teacher_id, days, start_time, end_time, monthly_fee, color)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [input.name, input.subject, input.level, input.room, input.teacher_id, input.days, input.start_time, input.end_time, input.monthly_fee, input.color],
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
       coalesce((select sum(p.amount) from payments p where p.student_id = s.id and p.month = $1), 0)::int as paid
     from students s left join groups g on g.id = s.group_id
     where s.active order by s.full_name`,
    [month],
  );
}

export async function monthlyTotals(month: string, count = 6) {
  const from = addMonths(month, -(count - 1));
  const rows = await q<{ month: string; total: number }>(
    `select month, sum(amount)::int as total from payments where month between $1 and $2 group by month`,
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
    `select method, sum(amount)::int as total, count(*)::int as n from payments where month = $1 group by method order by total desc`,
    [month],
  );
}

export type Payment = {
  id: number; student_id: number; full_name: string; group_name: string | null;
  amount: number; month: string; paid_at: string; method: string; note: string | null; created_by_name: string | null;
};

export async function recentPayments(month: string, limit = 50) {
  return q<Payment>(
    `select p.id, p.student_id, s.full_name, g.name as group_name, p.amount, p.month, p.paid_at, p.method, p.note,
       u.name as created_by_name
     from payments p join students s on s.id = p.student_id
     left join groups g on g.id = s.group_id left join users u on u.id = p.created_by
     where p.month = $1 order by p.paid_at desc, p.id desc limit $2`,
    [month, limit],
  );
}

export async function addPayment(input: {
  student_id: number; amount: number; month: string; paid_at: string; method: string; note: string | null; created_by: number;
}) {
  await q(
    `insert into payments (student_id, amount, month, paid_at, method, note, created_by) values ($1,$2,$3,$4,$5,$6,$7)`,
    [input.student_id, input.amount, input.month, input.paid_at, input.method, input.note, input.created_by],
  );
}

export async function deletePayment(id: number) {
  await q(`delete from payments where id = $1`, [id]);
}
