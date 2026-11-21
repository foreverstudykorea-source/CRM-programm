import type { Db } from "./db-core";
import { addDays, addMonths, monthOf, today, weekday } from "./dates";
import { generatePassword, hashPassword } from "./password";

export type Credential = { name: string; login: string; role: string; password: string };

/** Logins created by the demo data; the owner's own login must not be one of these. */
export const DEMO_LOGINS = ["admin", "moliya", "ustoz1", "ustoz2", "ustoz3", ...Array.from({ length: 25 }, (_, i) => `oquvchi${i + 1}`)];

// Small deterministic random generator so the demo looks the same every time.
function rng(seedNum: number) {
  let s = seedNum >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

async function insertMany(db: Db, table: string, cols: string[], rows: unknown[][]): Promise<number[]> {
  const ids: number[] = [];
  const chunk = 200;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const params: unknown[] = [];
    const values = part
      .map((row) => "(" + row.map((v) => (params.push(v), `$${params.length}`)).join(",") + ")")
      .join(",");
    const res = await db.query<{ id: number }>(
      `insert into ${table} (${cols.join(",")}) values ${values} returning id`,
      params,
    );
    ids.push(...res.map((r) => r.id));
  }
  return ids;
}

const TOPICS: Record<string, string[]> = {
  english: [
    "Present Simple: kundalik odatlar", "Present Continuous", "Oila va do'stlar haqida so'zlar",
    "Past Simple: muntazam fe'llar", "Past Simple: noto'g'ri fe'llar", "Raqamlar va vaqt",
    "Shahar va yo'nalishlar", "Can / Can't", "Ovqat va restoranda gaplashish", "Countable / Uncountable",
    "Comparatives va Superlatives", "Going to: rejalar", "Future Simple (will)", "Present Perfect",
    "Kasblar va ish joyi", "Sayohat lug'ati", "Speaking: o'zingiz haqingizda", "Listening amaliyoti",
    "Writing: e-mail yozish", "Takrorlash va test",
  ],
  ielts: [
    "Writing Task 1: Line graph", "Writing Task 1: Bar chart", "Writing Task 2: Opinion essay",
    "Writing Task 2: Discussion essay", "Reading: True / False / Not Given", "Reading: Matching headings",
    "Listening: Section 3 strategiyasi", "Speaking Part 2: Cue card", "Speaking Part 3: Fikr bildirish",
    "Academic vocabulary: Environment", "Academic vocabulary: Education", "Mock test: Listening",
    "Mock test: Reading", "Writing Task 2: Problem & Solution", "Coherence va Cohesion",
    "Grammatik aniqlik (Band 7)", "Paraphrasing texnikasi", "Mock test: Writing", "Speaking mock", "Tahlil va xatolar",
  ],
  math: [
    "Kvadrat tenglamalar", "Viet teoremasi", "Tengsizliklar sistemasi", "Modulli tenglamalar",
    "Progressiyalar", "Logarifmlar", "Ko'rsatkichli tenglamalar", "Trigonometrik ayniyatlar",
    "Trigonometrik tenglamalar", "Funksiya va grafik", "Hosila", "Integral asoslari",
    "Planimetriya: uchburchaklar", "Planimetriya: aylana", "Stereometriya", "Vektorlar",
    "Ehtimollar nazariyasi", "Matnli masalalar", "DTM test yechish", "Takrorlash",
  ],
  korean: [
    "Hangeul: unlilar", "Hangeul: undoshlar", "Batchim qoidalari", "인사: Salomlashish",
    "이에요 / 예요", "Raqamlar (sino-koreys)", "Raqamlar (koreys)", "Vaqt va soat",
    "Hozirgi zamon: 아요 / 어요", "O'tgan zamon: 았어요 / 었어요", "Joy kelishigi: 에 / 에서",
    "Oila a'zolari", "Do'konda xarid", "Kelasi zamon: (으)ㄹ 거예요", "Inkor: 안 / 못",
    "Ob-havo va fasllar", "TOPIK I: Listening", "TOPIK I: Reading", "Lug'at takrori", "Mock TOPIK I",
  ],
};

/**
 * Fills an empty database with demo data. Every account gets its own random password,
 * returned once to the caller and stored only as an Argon2id hash.
 * Pass `withAdmin: false` when the owner's admin account already exists.
 */
export async function seedDemo(db: Db, opts: { withAdmin: boolean; adminId?: number }): Promise<Credential[]> {
  const creds: Credential[] = [];
  const account = async (name: string, login: string, role: string) => {
    const password = generatePassword();
    creds.push({ name, login, role, password });
    return hashPassword(password);
  };
  const rand = rng(2026);
  const t = today();

  // --- Staff -----------------------------------------------------------------
  const staff: [string, string, string, string][] = [
    ["Sardor Qodirov", "moliya", "finance", "+998 90 444 55 66"],
    ["Dilnoza Karimova", "ustoz1", "teacher", "+998 91 234 56 78"],
    ["Jasur Toshmatov", "ustoz2", "teacher", "+998 93 345 67 89"],
    ["Madina Rahimova", "ustoz3", "teacher", "+998 94 456 78 90"],
  ];
  if (opts.withAdmin) staff.unshift(["Nilufar Azimova", "admin", "admin", "+998 90 111 22 33"]);
  const staffRows: unknown[][] = [];
  for (const [name, login, role, phone] of staff) staffRows.push([name, login, await account(name, login, role), role, phone]);
  const staffIds = await insertMany(db, "users", ["name", "login", "password_hash", "role", "phone"], staffRows);
  if (!opts.withAdmin) staffIds.unshift(opts.adminId ?? 0);
  const [adminId, financeId, t1, t2, t3] = staffIds;

  // --- Groups ----------------------------------------------------------------
  const groupDefs = [
    { name: "English Beginner", subject: "Ingliz tili", level: "Beginner (A1)", room: "101-xona", teacher: t1, days: "1,3,5", start: "09:00", end: "10:30", fee: 450000, color: "indigo", topics: "english" },
    { name: "English Pre-Intermediate", subject: "Ingliz tili", level: "Pre-Intermediate (A2)", room: "102-xona", teacher: t1, days: "1,3,5", start: "14:00", end: "15:30", fee: 500000, color: "violet", topics: "english" },
    { name: "IELTS 6.5+", subject: "IELTS", level: "Upper-Intermediate (B2)", room: "201-xona", teacher: t3, days: "2,4,6", start: "16:00", end: "17:30", fee: 700000, color: "rose", topics: "ielts" },
    { name: "Matematika Abituriyent", subject: "Matematika", level: "Abituriyent", room: "202-xona", teacher: t2, days: "2,4,6", start: "10:00", end: "11:30", fee: 550000, color: "emerald", topics: "math" },
    { name: "Koreys tili TOPIK I", subject: "Koreys tili", level: "Boshlang'ich (TOPIK I)", room: "103-xona", teacher: t3, days: "1,3,5", start: "16:00", end: "17:30", fee: 600000, color: "amber", topics: "korean" },
  ];
  const groupIds = await insertMany(
    db,
    "groups",
    ["name", "subject", "level", "room", "teacher_id", "days", "start_time", "end_time", "monthly_fee", "color"],
    groupDefs.map((g) => [g.name, g.subject, g.level, g.room, g.teacher, g.days, g.start, g.end, g.fee, g.color]),
  );

  // --- Students (each gets a login: oquvchi1 … oquvchi25) --------------------
  const first = ["Aziz", "Malika", "Bekzod", "Sevinch", "Javohir", "Zarina", "Otabek", "Mohinur", "Sherzod", "Dildora",
    "Akmal", "Shahzoda", "Islom", "Gulnoza", "Doniyor", "Nodira", "Sardor", "Kamola", "Ulug'bek", "Madina",
    "Abdulloh", "Rayhona", "Temur", "Laylo", "Bobur"];
  const last = ["Aliyev", "Karimova", "Yusupov", "Rashidova", "Tursunov", "Ergasheva", "Nazarov", "Saidova", "Xolmatov", "Abdullayeva",
    "Mirzayev", "Qosimova", "Rahimov", "Sobirova", "Ismoilov", "Hamidova", "Umarov", "Jo'rayeva", "Sultonov", "Usmonova",
    "Valiyev", "Nurmatova", "Shodiyev", "Ahmedova", "Fayziyev"];
  const parentFirst = ["Rustam", "Gulchehra", "Anvar", "Dilfuza", "Farhod", "Mavluda", "Shuhrat", "Nargiza", "Baxtiyor", "Feruza"];

  const studentUserRows: unknown[][] = [];
  for (let i = 0; i < first.length; i++) {
    const name = `${first[i]} ${last[i]}`;
    const login = `oquvchi${i + 1}`;
    studentUserRows.push([name, login, await account(name, login, "student"), "student", `+998 9${i % 10} ${100 + i * 7} ${10 + i} ${20 + i}`]);
  }
  const studentUsers = await insertMany(db, "users", ["name", "login", "password_hash", "role", "phone"], studentUserRows);
  const studentRows = first.map((f, i) => {
    const surname = last[i].replace(/a$/, "");
    const pi = i % parentFirst.length;
    const parent = `${parentFirst[pi]} ${surname}${pi % 2 === 1 ? "a" : ""}`; // odd index = mother
    return [
      studentUsers[i],
      `${f} ${last[i]}`,
      `+998 9${i % 10} ${100 + i * 7} ${10 + i} ${20 + i}`,
      parent,
      `+998 9${(i + 3) % 10} ${200 + i * 11} ${30 + i} ${40 + i}`,
      groupIds[i % groupIds.length],
      addDays(t, -120 + i),
    ];
  });
  const studentIds = await insertMany(
    db,
    "students",
    ["user_id", "full_name", "phone", "parent_name", "parent_phone", "group_id", "joined_at"],
    studentRows,
  );
  const studentsByGroup = new Map<number, number[]>();
  studentIds.forEach((sid, i) => {
    const gid = studentRows[i][5] as number;
    studentsByGroup.set(gid, [...(studentsByGroup.get(gid) ?? []), sid]);
  });

  // --- Lessons: 3 weeks back, 2 weeks ahead -----------------------------------
  const todaysGroups = groupDefs
    .map((g, i) => ({ ...g, id: groupIds[i] }))
    .filter((g) => g.days.split(",").map(Number).includes(weekday(t)))
    .sort((a, b) => a.start.localeCompare(b.start));
  // On "today", only the earliest group is already marked; the rest are left for the teacher demo.
  const markedToday = new Set(todaysGroups.slice(0, 1).map((g) => g.id));

  const lessonRows: unknown[][] = [];
  const lessonMeta: { group: number; date: string; marked: boolean }[] = [];
  groupDefs.forEach((g, gi) => {
    const gid = groupIds[gi];
    const days = g.days.split(",").map(Number);
    let n = 0;
    for (let d = -21; d <= 14; d++) {
      const date = addDays(t, d);
      if (!days.includes(weekday(date))) continue;
      const topic = TOPICS[g.topics][n % TOPICS[g.topics].length];
      n++;
      const marked = d < 0 || (d === 0 && markedToday.has(gid));
      lessonRows.push([gid, date, topic, marked ? new Date().toISOString() : null]);
      lessonMeta.push({ group: gid, date, marked });
    }
  });
  const lessonIds = await insertMany(db, "lessons", ["group_id", "date", "topic", "marked_at"], lessonRows);

  // --- Attendance ------------------------------------------------------------
  const attRows: unknown[][] = [];
  const attMeta: { status: string; date: string }[] = [];
  lessonMeta.forEach((l, i) => {
    if (!l.marked) return;
    for (const sid of studentsByGroup.get(l.group) ?? []) {
      const r = rand();
      const status = r < 0.13 ? "absent" : r < 0.19 ? "late" : "present";
      attRows.push([lessonIds[i], sid, status]);
      attMeta.push({ status, date: l.date });
    }
  });
  const attIds = await insertMany(db, "attendance", ["lesson_id", "student_id", "status"], attRows);

  // Older absences already handled by the admin; recent ones are still to call.
  const callRows: unknown[][] = [];
  const notes: Record<string, string> = {
    called: "Ota-onasi bilan gaplashildi, kasal bo'lgan",
    messaged: "Telegram orqali xabar yuborildi",
    no_answer: "Telefonni ko'tarmadi, ertaga qayta qo'ng'iroq",
  };
  attMeta.forEach((a, i) => {
    if (a.status !== "absent" || a.date > addDays(t, -3)) return;
    const r = rand();
    const status = r < 0.6 ? "called" : r < 0.85 ? "messaged" : "no_answer";
    callRows.push([attIds[i], status, notes[status], adminId || null]);
  });
  if (callRows.length) {
    await insertMany(db, "calls", ["attendance_id", "status", "note", "updated_by"], callRows);
    await insertMany(db, "call_logs", ["attendance_id", "outcome", "note", "created_by"], callRows);
  }

  // --- Payments: previous 3 months mostly paid, current month partly ---------
  const thisMonth = monthOf(t);
  const methods = ["Naqd", "Karta", "Click", "Payme"];
  const payRows: unknown[][] = [];
  studentIds.forEach((sid, i) => {
    const fee = groupDefs[i % groupDefs.length].fee;
    for (let back = 3; back >= 0; back--) {
      const month = addMonths(thisMonth, -back);
      const r = rand();
      const dayOfMonth = String(1 + Math.floor(rand() * 9)).padStart(2, "0");
      let paidAt = `${month}-${dayOfMonth}`;
      if (paidAt > t) paidAt = t;
      if (back > 0) {
        if (r < 0.92) payRows.push([sid, fee, month, paidAt, methods[Math.floor(rand() * 4)], null, financeId]);
      } else if (r < 0.55) {
        payRows.push([sid, fee, month, paidAt, methods[Math.floor(rand() * 4)], null, financeId]);
      } else if (r < 0.72) {
        payRows.push([sid, Math.round(fee / 2), month, paidAt, methods[Math.floor(rand() * 4)], "Qisman to'lov", financeId]);
      }
    }
  });
  await insertMany(db, "payments", ["student_id", "amount", "month", "paid_at", "method", "note", "created_by"], payRows);
  return creds;
}
