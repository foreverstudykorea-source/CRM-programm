import type { Db } from "./db-core";
import { verifyLegacyScrypt } from "./password";

// Dates are stored as ISO text (YYYY-MM-DD) and months as YYYY-MM so both
// database adapters return plain strings.

/** v1: the original schema (kept identical so that existing databases upgrade in place). */
const V1 = `
create table if not exists users (
  id serial primary key,
  name text not null,
  login text not null unique,
  password_hash text not null,
  role text not null check (role in ('student','teacher','admin','finance')),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id serial primary key,
  name text not null,
  subject text not null,
  level text not null,
  room text not null,
  teacher_id int references users(id) on delete set null,
  days text not null,
  start_time text not null,
  end_time text not null,
  monthly_fee int not null default 0,
  color text not null default 'indigo'
);

create table if not exists students (
  id serial primary key,
  user_id int unique references users(id) on delete set null,
  full_name text not null,
  phone text,
  parent_name text,
  parent_phone text,
  group_id int references groups(id) on delete set null,
  joined_at text not null,
  active boolean not null default true
);

create table if not exists lessons (
  id serial primary key,
  group_id int not null references groups(id) on delete cascade,
  date text not null,
  topic text,
  marked_at timestamptz,
  unique (group_id, date)
);

create table if not exists attendance (
  id serial primary key,
  lesson_id int not null references lessons(id) on delete cascade,
  student_id int not null references students(id) on delete cascade,
  status text not null check (status in ('present','absent','late')),
  unique (lesson_id, student_id)
);

create table if not exists calls (
  id serial primary key,
  attendance_id int not null unique references attendance(id) on delete cascade,
  status text not null check (status in ('pending','called','no_answer','messaged')),
  note text,
  updated_by int references users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id serial primary key,
  student_id int not null references students(id) on delete cascade,
  amount int not null,
  month text not null,
  paid_at text not null,
  method text not null,
  note text,
  created_by int references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lessons_date on lessons(date);
create index if not exists idx_payments_month on payments(month);
`;

/** v2: security hardening. */
const V2 = `
alter table users alter column password_hash drop not null;
alter table users add column if not exists active boolean not null default true;
alter table users add column if not exists must_change_password boolean not null default false;
alter table users add column if not exists password_changed_at timestamptz;
alter table users add column if not exists last_login_at timestamptz;
create unique index if not exists idx_users_login_lower on users (lower(login));

create table if not exists sessions (
  id text primary key,                         -- HMAC of the cookie token; the token itself is never stored
  user_id int not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ip text,
  user_agent text
);
create index if not exists idx_sessions_user on sessions(user_id);

create table if not exists auth_attempts (
  id bigserial primary key,
  key text not null,
  success boolean not null,
  at timestamptz not null default now()
);
create index if not exists idx_auth_attempts_key_at on auth_attempts(key, at);

create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id int references users(id) on delete set null,
  actor_name text,
  actor_role text,
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  ip text
);
create index if not exists idx_audit_at on audit_log(at desc);
create index if not exists idx_audit_action on audit_log(action);

create table if not exists call_logs (
  id serial primary key,
  attendance_id int not null references attendance(id) on delete cascade,
  outcome text not null check (outcome in ('called','no_answer','messaged')),
  note text,
  created_by int references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_call_logs_att on call_logs(attendance_id);

alter table payments add column if not exists voided_at timestamptz;
alter table payments add column if not exists voided_by int references users(id) on delete set null;
alter table payments add column if not exists void_reason text;

-- The audit log is append-only, even for someone with direct SQL access through the app.
create or replace function audit_log_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;
drop trigger if exists trg_audit_log_immutable on audit_log;
create trigger trg_audit_log_immutable before update or delete on audit_log
  for each row execute function audit_log_immutable();

create index if not exists idx_attendance_student on attendance(student_id);
create index if not exists idx_students_group on students(group_id);
`;

type Migration = { id: number; name: string; up: (db: Db) => Promise<void> };

export const MIGRATIONS: Migration[] = [
  { id: 1, name: "base schema", up: (db) => db.exec(V1) },
  {
    id: 2,
    name: "security hardening",
    up: async (db) => {
      await db.exec(V2);
      // The previous version shipped every account with the public password "demo123".
      // Those passwords are known to anyone who read the README, so switch them off.
      // An administrator (or the /setup page) issues new passwords.
      const legacy = await db.query<{ id: number; password_hash: string }>(
        `select id, password_hash from users where password_hash is not null and password_hash not like '$argon2%'`,
      );
      for (const u of legacy) {
        if (verifyLegacyScrypt("demo123", u.password_hash)) {
          await db.query(`update users set password_hash = null, must_change_password = true where id = $1`, [u.id]);
        }
      }
    },
  },
];

const LOCK_ID = 7_310_412; // arbitrary constant for pg_advisory_xact_lock

export async function migrate(db: Db) {
  await db.exec(`create table if not exists schema_migrations (id int primary key, name text not null, applied_at timestamptz not null default now())`);
  await db.transaction(async (t) => {
    // Serverless cold starts can run this concurrently; the lock makes it run once.
    await t.query(`select pg_advisory_xact_lock($1)`, [LOCK_ID]);
    const done = new Set((await t.query<{ id: number }>(`select id from schema_migrations`)).map((r) => r.id));
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      await m.up(t);
      await t.query(`insert into schema_migrations (id, name) values ($1, $2)`, [m.id, m.name]);
    }
  });
}
