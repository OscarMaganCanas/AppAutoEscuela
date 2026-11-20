-- ============================================================
-- Autoescuela Rosales · Supabase Schema
-- ============================================================
-- Instrucciones:
--   1. Ve a tu proyecto Supabase → SQL Editor → New query
--   2. Pega este archivo completo y ejecuta (Run)
--   3. Después crea los usuarios en Authentication → Users
--      con los emails de ejemplo y contraseña que quieras
--   4. Luego ejecuta el bloque "Vincular auth" al final
-- ============================================================


-- ── 1. Tablas ───────────────────────────────────────────────

create table if not exists teachers (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name         text not null,
  initials     text not null,
  created_at   timestamptz default now()
);

create table if not exists students (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid references auth.users(id) on delete set null,
  name          text not null,
  email         text not null unique,
  role          text not null default 'NUEVO'
                  check (role in ('NUEVO', 'PRINCIPIANTE', 'PRIORIDAD')),
  teacher_id    uuid references teachers(id),
  classes_taken integer not null default 0,
  created_at    timestamptz default now()
);

create table if not exists bookings (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  teacher_id uuid not null references teachers(id),
  date_iso   text not null,   -- YYYY-MM-DD
  hour       integer not null check (hour in (9,10,11,12,13,16,17,18,19)),
  created_at timestamptz default now(),
  unique (teacher_id, date_iso, hour)
);


-- ── 2. Row Level Security ────────────────────────────────────
-- MVP: cualquier usuario autenticado puede leer todo y escribir.
-- Cuando tengas multi-tenant, restringe por school_id.

alter table teachers enable row level security;
alter table students enable row level security;
alter table bookings enable row level security;

create policy "teachers_select"  on teachers for select to authenticated using (true);
create policy "students_select"  on students for select to authenticated using (true);
create policy "students_update"  on students for update to authenticated using (true) with check (true);
create policy "bookings_select"  on bookings for select to authenticated using (true);
create policy "bookings_insert"  on bookings for insert to authenticated with check (true);
create policy "bookings_delete"  on bookings for delete to authenticated using (true);


-- ── 3. Datos de ejemplo ──────────────────────────────────────

do $$
declare
  t1 uuid; t2 uuid; t3 uuid;
begin
  insert into teachers (name, initials) values ('Carlos Méndez', 'CM') returning id into t1;
  insert into teachers (name, initials) values ('Laura Jiménez',  'LJ') returning id into t2;
  insert into teachers (name, initials) values ('David Romero',   'DR') returning id into t3;

  insert into students (name, email, role, teacher_id, classes_taken) values
    ('Marta Ruiz',    'marta.ruiz@demo.com',    'PRIORIDAD',   t1, 22),
    ('Javier Soto',   'javier.soto@demo.com',   'PRINCIPIANTE',t1,  4),
    ('Ana Castillo',  'ana.castillo@demo.com',   'NUEVO',       t1,  0),
    ('Pablo Vega',    'pablo.vega@demo.com',     'PRINCIPIANTE',t2,  3),
    ('Lucía Ortega',  'lucia.ortega@demo.com',   'PRIORIDAD',   t2, 18),
    ('Hugo Navarro',  'hugo.navarro@demo.com',   'NUEVO',       t2,  0),
    ('Elena Pardo',   'elena.pardo@demo.com',    'PRINCIPIANTE',t3,  6),
    ('Iván Salas',    'ivan.salas@demo.com',     'PRIORIDAD',   t3, 25);
end $$;


-- ── 4. Vincular auth_user_id (ejecutar DESPUÉS de crear usuarios) ──
-- Crea los usuarios en Authentication → Users con estos emails.
-- Luego ejecuta estas queries para vincularlos:
--
-- update teachers set auth_user_id = (select id from auth.users where email = 'carlos.mendez@demo.com') where name = 'Carlos Méndez';
-- update teachers set auth_user_id = (select id from auth.users where email = 'laura.jimenez@demo.com')  where name = 'Laura Jiménez';
-- update teachers set auth_user_id = (select id from auth.users where email = 'david.romero@demo.com')   where name = 'David Romero';
--
-- update students set auth_user_id = (select id from auth.users where email = 'marta.ruiz@demo.com')    where email = 'marta.ruiz@demo.com';
-- update students set auth_user_id = (select id from auth.users where email = 'javier.soto@demo.com')   where email = 'javier.soto@demo.com';
-- update students set auth_user_id = (select id from auth.users where email = 'ana.castillo@demo.com')  where email = 'ana.castillo@demo.com';
-- update students set auth_user_id = (select id from auth.users where email = 'pablo.vega@demo.com')    where email = 'pablo.vega@demo.com';
-- update students set auth_user_id = (select id from auth.users where email = 'lucia.ortega@demo.com')  where email = 'lucia.ortega@demo.com';
-- update students set auth_user_id = (select id from auth.users where email = 'hugo.navarro@demo.com')  where email = 'hugo.navarro@demo.com';
-- update students set auth_user_id = (select id from auth.users where email = 'elena.pardo@demo.com')   where email = 'elena.pardo@demo.com';
-- update students set auth_user_id = (select id from auth.users where email = 'ivan.salas@demo.com')    where email = 'ivan.salas@demo.com';
