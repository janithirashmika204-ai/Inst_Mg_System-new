-- EduPeak initial Supabase schema
-- Apply this file in Supabase Dashboard > SQL Editor.
-- No demo/student/teacher/payment rows are inserted by this migration.

create schema if not exists private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.institutes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  registration_number text,
  address text,
  phone text,
  email text,
  timezone text not null default 'Asia/Colombo',
  currency_code text not null default 'LKR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index user_profiles_username_lower_uidx
  on public.user_profiles (lower(username)) where username is not null;

create table public.institute_memberships (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in (
    'super_admin', 'admin', 'manager', 'registrar', 'teacher',
    'accountant', 'attendance_staff', 'viewer'
  )),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, user_id)
);
create index institute_memberships_user_idx on public.institute_memberships(user_id, status);

create table public.branches (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  id text not null,
  name text not null,
  address text,
  phone text,
  status text not null default 'Active',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, id),
  unique (institute_id, name)
);

create table public.students (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  id text not null,
  student_code text not null,
  full_name text not null,
  nic text,
  date_of_birth date,
  gender text,
  email text,
  phone text,
  address text,
  city text,
  school text,
  current_grade text,
  first_enrolled_grade text,
  enrollment_date date,
  parent_name text,
  parent_phone text,
  branch text,
  monthly_fee numeric(12,2) not null default 0 check (monthly_fee >= 0),
  concession text not null default 'None',
  status text not null default 'Active',
  avatar text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, id),
  unique (institute_id, student_code)
);
create index students_name_idx on public.students(institute_id, lower(full_name));
create index students_grade_idx on public.students(institute_id, current_grade);
create index students_phone_idx on public.students(institute_id, phone);

create table public.teachers (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  id text not null,
  full_name text not null,
  nic text,
  primary_subject text,
  phone text,
  email text,
  branch text,
  joined_date date,
  avatar text,
  status text not null default 'Active',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, id)
);
create index teachers_name_idx on public.teachers(institute_id, lower(full_name));

create table public.classes (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  id text not null,
  name text not null,
  grade text,
  subject text,
  teacher text,
  weekday text,
  start_time text,
  end_time text,
  schedule_text text,
  room text,
  capacity integer check (capacity is null or capacity >= 0),
  enrolled integer not null default 0 check (enrolled >= 0),
  monthly_fee numeric(12,2) not null default 0 check (monthly_fee >= 0),
  delivery_type text,
  status text not null default 'Active',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, id)
);
create index classes_teacher_idx on public.classes(institute_id, teacher);
create index classes_schedule_idx on public.classes(institute_id, weekday, start_time);

create table public.student_class_enrollments (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  student_id text not null,
  class_id text not null,
  enrolled_on date not null default current_date,
  is_free boolean not null default false,
  is_half_card boolean not null default false,
  status text not null default 'Active',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, student_id, class_id),
  foreign key (institute_id, student_id) references public.students(institute_id, id) on delete cascade,
  foreign key (institute_id, class_id) references public.classes(institute_id, id) on delete cascade,
  check (not (is_free and is_half_card))
);
create index student_class_enrollments_class_idx on public.student_class_enrollments(institute_id, class_id);

create table public.attendance_records (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  id text not null,
  student_id text,
  student_name text not null,
  grade text,
  class_id text,
  class_name text,
  teacher text,
  attendance_date date not null,
  attendance_time text,
  status text not null,
  notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, id)
);
create index attendance_date_idx on public.attendance_records(institute_id, attendance_date desc);
create index attendance_student_idx on public.attendance_records(institute_id, student_id, attendance_date desc);
create index attendance_class_idx on public.attendance_records(institute_id, class_id, attendance_date desc);

create table public.fee_payments (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  id text not null,
  student_id text,
  student_name text not null,
  teacher text,
  subject text,
  class_id text,
  month_label text,
  amount numeric(12,2) not null check (amount >= 0),
  payment_date date,
  payment_time text,
  method text,
  status text not null default 'Paid',
  receipt_number text,
  notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, id)
);
create index fee_payments_date_idx on public.fee_payments(institute_id, payment_date desc);
create index fee_payments_student_idx on public.fee_payments(institute_id, student_id, payment_date desc);
create index fee_payments_month_idx on public.fee_payments(institute_id, month_label, status);

create table public.exams (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  id text not null,
  name text not null,
  class_name text,
  teacher text,
  exam_date date,
  exam_time text,
  exam_type text,
  duration text,
  total_marks numeric(10,2),
  venue text,
  status text not null default 'Scheduled',
  notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, id)
);
create index exams_date_idx on public.exams(institute_id, exam_date);

create table public.exam_results (
  institute_id uuid not null references public.institutes(id) on delete cascade,
  id text not null,
  exam_id text not null,
  student_id text not null,
  student_name text,
  marks_obtained numeric(10,2),
  total_marks numeric(10,2),
  grade text,
  remarks text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (institute_id, id),
  foreign key (institute_id, exam_id) references public.exams(institute_id, id) on delete cascade,
  foreign key (institute_id, student_id) references public.students(institute_id, id) on delete cascade
);
create index exam_results_student_idx on public.exam_results(institute_id, student_id);

create table public.institute_settings (
  institute_id uuid primary key references public.institutes(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_institute_created_idx on public.audit_logs(institute_id, created_at desc);

-- Keep user_profiles in sync with Supabase Auth. Membership assignment is a
-- deliberate admin/bootstrap action; signing up alone grants no institute access.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, email, full_name, username)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'username', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, user_profiles.full_name),
        username = coalesce(excluded.username, user_profiles.username),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_edupeak on auth.users;
create trigger on_auth_user_created_edupeak
after insert on auth.users
for each row execute function public.handle_new_auth_user();
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Membership/role helpers. SECURITY DEFINER avoids recursive membership RLS.
create or replace function private.is_institute_member(target_institute_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institute_memberships m
    where m.institute_id = target_institute_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function private.has_institute_role(target_institute_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institute_memberships m
    where m.institute_id = target_institute_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any (allowed_roles)
  );
$$;

revoke all on function private.is_institute_member(uuid) from public, anon;
revoke all on function private.has_institute_role(uuid, text[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_institute_member(uuid) to authenticated;
grant execute on function private.has_institute_role(uuid, text[]) to authenticated;

-- updated_at triggers
create trigger institutes_set_updated_at before update on public.institutes for each row execute function public.set_updated_at();
create trigger user_profiles_set_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();
create trigger memberships_set_updated_at before update on public.institute_memberships for each row execute function public.set_updated_at();
create trigger branches_set_updated_at before update on public.branches for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();
create trigger teachers_set_updated_at before update on public.teachers for each row execute function public.set_updated_at();
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();
create trigger enrollments_set_updated_at before update on public.student_class_enrollments for each row execute function public.set_updated_at();
create trigger attendance_set_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
create trigger fee_payments_set_updated_at before update on public.fee_payments for each row execute function public.set_updated_at();
create trigger exams_set_updated_at before update on public.exams for each row execute function public.set_updated_at();
create trigger exam_results_set_updated_at before update on public.exam_results for each row execute function public.set_updated_at();
create trigger institute_settings_set_updated_at before update on public.institute_settings for each row execute function public.set_updated_at();

-- RLS is enabled on every exposed public table. Never put a service-role key in Vite.
alter table public.institutes enable row level security;
alter table public.user_profiles enable row level security;
alter table public.institute_memberships enable row level security;
alter table public.branches enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.student_class_enrollments enable row level security;
alter table public.attendance_records enable row level security;
alter table public.fee_payments enable row level security;
alter table public.exams enable row level security;
alter table public.exam_results enable row level security;
alter table public.institute_settings enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select, update on public.user_profiles to authenticated;
grant select, update on public.institutes to authenticated;
grant select, insert, update, delete on
  public.institute_memberships, public.branches, public.students, public.teachers,
  public.classes, public.student_class_enrollments, public.attendance_records,
  public.fee_payments, public.exams, public.exam_results, public.institute_settings,
  public.audit_logs
  to authenticated;

-- User profile: each user can read/update only their own profile.
create policy user_profiles_read_self on public.user_profiles
for select to authenticated using (id = (select auth.uid()));
create policy user_profiles_update_self on public.user_profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Institute and membership directory.
create policy institutes_read_member on public.institutes
for select to authenticated using (private.is_institute_member(id));
create policy institutes_update_admin on public.institutes
for update to authenticated using (private.has_institute_role(id, array['super_admin','admin']))
with check (private.has_institute_role(id, array['super_admin','admin']));

create policy memberships_read_member on public.institute_memberships
for select to authenticated using (private.is_institute_member(institute_id));
create policy memberships_insert_admin on public.institute_memberships
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin']));
create policy memberships_update_super_admin on public.institute_memberships
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin']))
with check (private.has_institute_role(institute_id, array['super_admin']));
create policy memberships_delete_super_admin on public.institute_memberships
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin']));

-- Branches.
create policy branches_read_member on public.branches
for select to authenticated using (private.is_institute_member(institute_id));
create policy branches_insert_admin on public.branches
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager']));
create policy branches_update_admin on public.branches
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager']));
create policy branches_delete_admin on public.branches
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));

-- Students.
create policy students_read_member on public.students
for select to authenticated using (private.is_institute_member(institute_id));
create policy students_insert_staff on public.students
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','registrar']));
create policy students_update_staff on public.students
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager','registrar']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','registrar']));
create policy students_delete_admin on public.students
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));

-- Teachers.
create policy teachers_read_member on public.teachers
for select to authenticated using (private.is_institute_member(institute_id));
create policy teachers_insert_admin on public.teachers
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager']));
create policy teachers_update_admin on public.teachers
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager']));
create policy teachers_delete_admin on public.teachers
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));

-- Classes and student-class links.
create policy classes_read_member on public.classes
for select to authenticated using (private.is_institute_member(institute_id));
create policy classes_insert_admin on public.classes
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager']));
create policy classes_update_admin on public.classes
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager']));
create policy classes_delete_admin on public.classes
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));

create policy enrollments_read_member on public.student_class_enrollments
for select to authenticated using (private.is_institute_member(institute_id));
create policy enrollments_insert_staff on public.student_class_enrollments
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','registrar']));
create policy enrollments_update_staff on public.student_class_enrollments
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager','registrar']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','registrar']));
create policy enrollments_delete_admin on public.student_class_enrollments
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager','registrar']));

-- Attendance.
create policy attendance_read_member on public.attendance_records
for select to authenticated using (private.is_institute_member(institute_id));
create policy attendance_insert_staff on public.attendance_records
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher','attendance_staff']));
create policy attendance_update_staff on public.attendance_records
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher','attendance_staff']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher','attendance_staff']));
create policy attendance_delete_admin on public.attendance_records
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));

-- Fees and payment history.
create policy fees_read_accounts on public.fee_payments
for select to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager','accountant']));
create policy fees_insert_accounts on public.fee_payments
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','accountant']));
create policy fees_update_accounts on public.fee_payments
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager','accountant']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','accountant']));
create policy fees_delete_admin on public.fee_payments
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));

-- Exams and results.
create policy exams_read_member on public.exams
for select to authenticated using (private.is_institute_member(institute_id));
create policy exams_insert_staff on public.exams
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher']));
create policy exams_update_staff on public.exams
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher']));
create policy exams_delete_admin on public.exams
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));

create policy results_read_member on public.exam_results
for select to authenticated using (private.is_institute_member(institute_id));
create policy results_insert_staff on public.exam_results
for insert to authenticated with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher']));
create policy results_update_staff on public.exam_results
for update to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher']))
with check (private.has_institute_role(institute_id, array['super_admin','admin','manager','teacher']));
create policy results_delete_admin on public.exam_results
for delete to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));

-- Settings and audit trail.
create policy settings_read_member on public.institute_settings
for select to authenticated using (private.is_institute_member(institute_id));
create policy settings_manage_admin on public.institute_settings
for all to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']))
with check (private.has_institute_role(institute_id, array['super_admin','admin']));

create policy audit_logs_read_admin on public.audit_logs
for select to authenticated using (private.has_institute_role(institute_id, array['super_admin','admin']));
create policy audit_logs_insert_member on public.audit_logs
for insert to authenticated with check (
  actor_user_id = (select auth.uid()) and private.is_institute_member(institute_id)
);

comment on table public.students is 'Student registry. raw_data preserves EduPeak frontend-specific fields during the staged migration.';
comment on table public.fee_payments is 'Payment transactions and receipts; do not store payment gateway secrets here.';
comment on table public.student_class_enrollments is 'Normalized student-to-class enrollment including free/half-card concessions.';
comment on table public.audit_logs is 'Append-only operational audit events for administrative traceability.';
