// Dates are stored as ISO text (YYYY-MM-DD) and months as YYYY-MM so both
// database adapters return plain strings.
export const SCHEMA_SQL = `
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
  days text not null,            -- ISO weekdays, e.g. '1,3,5' (1 = Monday)
  start_time text not null,      -- '14:00'
  end_time text not null,        -- '15:30'
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
