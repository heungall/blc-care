create extension if not exists pgcrypto with schema extensions;

create type public.assignment_role as enum ('leader', 'assistant');
create type public.member_status as enum ('active', 'dormant', 'left', 'archived');
create type public.bible_study_status as enum ('unknown', 'not_started', 'in_progress', 'completed');
create type public.baptism_status as enum ('unknown', 'not_baptized', 'baptized', 'infant_baptized', 'confirmation');
create type public.report_status as enum ('draft', 'submitted', 'locked');
create type public.attendance_status as enum ('present', 'absent', 'excused', 'unknown');
create type public.prayer_parsed_by as enum ('manual', 'rule', 'ai');
create type public.newcomer_status as enum ('new', 'contacted', 'converted', 'archived');
create type public.absence_alert_status as enum ('open', 'checked', 'resolved');
create type public.audit_action as enum ('create', 'update', 'delete', 'convert', 'resolve', 'login');

create table public.users (
  user_id uuid primary key default extensions.gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  name text not null,
  roles text[] not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_not_blank check (btrim(email) <> ''),
  constraint users_name_not_blank check (btrim(name) <> ''),
  constraint users_roles_supported check (
    cardinality(roles) > 0
    and roles <@ array['admin', 'cell_leader']::text[]
    and array_position(roles, null) is null
  )
);

create unique index users_email_lower_key on public.users (lower(email));

create table public.cells (
  cell_id uuid primary key default extensions.gen_random_uuid(),
  cell_name text not null,
  active boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cells_name_not_blank check (btrim(cell_name) <> ''),
  constraint cells_sort_order_nonnegative check (sort_order is null or sort_order >= 0)
);

create unique index cells_name_lower_key on public.cells (lower(cell_name));

create table public.user_cell_assignments (
  assignment_id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete restrict,
  cell_id uuid not null references public.cells(cell_id) on delete restrict,
  assignment_role public.assignment_role not null,
  active boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_cell_assignments_period_valid check (
    start_date is null or end_date is null or start_date <= end_date
  ),
  constraint user_cell_assignments_user_cell_key unique (user_id, cell_id)
);

create table public.members (
  member_id uuid primary key default extensions.gen_random_uuid(),
  full_name text not null,
  display_name text not null,
  name_aliases text[] not null default '{}',
  photo_file_id text,
  photo_url text,
  phone text,
  birth_date date,
  age smallint,
  first_visit_date date,
  registration_date date,
  address text,
  workplace text,
  occupation text,
  job_title text,
  faith_start_year smallint,
  bible_study_status public.bible_study_status,
  baptism_status public.baptism_status,
  family_info text,
  current_cell_id uuid references public.cells(cell_id) on delete restrict,
  status public.member_status not null default 'active',
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(user_id) on delete set null,
  updated_by uuid references public.users(user_id) on delete set null,
  constraint members_full_name_not_blank check (btrim(full_name) <> ''),
  constraint members_display_name_not_blank check (btrim(display_name) <> ''),
  constraint members_aliases_no_null check (array_position(name_aliases, null) is null),
  constraint members_age_valid check (age is null or age between 0 and 150),
  constraint members_faith_start_year_valid check (
    faith_start_year is null or faith_start_year between 1000 and 9999
  )
);

create table public.cell_member_history (
  history_id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete restrict,
  from_cell_id uuid references public.cells(cell_id) on delete restrict,
  to_cell_id uuid not null references public.cells(cell_id) on delete restrict,
  start_date date not null,
  end_date date,
  reason text,
  changed_by uuid references public.users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint cell_member_history_period_valid check (end_date is null or start_date <= end_date),
  constraint cell_member_history_different_cells check (
    from_cell_id is null or from_cell_id <> to_cell_id
  )
);

create unique index cell_member_history_one_current_per_member
  on public.cell_member_history (member_id)
  where end_date is null;

create table public.weekly_cell_reports (
  report_id uuid primary key default extensions.gen_random_uuid(),
  week_start_date date not null,
  week_end_date date not null,
  report_date date,
  cell_id uuid not null references public.cells(cell_id) on delete restrict,
  leader_user_id uuid not null references public.users(user_id) on delete restrict,
  overall_summary text,
  status public.report_status not null default 'draft',
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint weekly_cell_reports_cell_week_key unique (cell_id, week_start_date),
  constraint weekly_cell_reports_report_scope_key unique (report_id, cell_id, week_start_date),
  constraint weekly_cell_reports_week_starts_monday check (extract(isodow from week_start_date) = 1),
  constraint weekly_cell_reports_week_range check (week_end_date = week_start_date + 6),
  constraint weekly_cell_reports_report_date_in_week check (
    report_date is null or report_date between week_start_date and week_end_date
  ),
  constraint weekly_cell_reports_locked_consistent check (status <> 'locked' or locked)
);

create table public.weekly_member_records (
  record_id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null,
  member_id uuid not null references public.members(member_id) on delete restrict,
  cell_id uuid not null references public.cells(cell_id) on delete restrict,
  week_start_date date not null,
  report_date date,
  attendance_status public.attendance_status not null default 'unknown',
  absence_reason text,
  sharing_summary text,
  prayer_request text,
  support_suggestion text,
  prayer_source_text text,
  prayer_parsed_by public.prayer_parsed_by,
  prayer_parse_confidence numeric(5, 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(user_id) on delete set null,
  updated_by uuid references public.users(user_id) on delete set null,
  constraint weekly_member_records_report_scope_fkey
    foreign key (report_id, cell_id, week_start_date)
    references public.weekly_cell_reports(report_id, cell_id, week_start_date)
    on delete restrict,
  constraint weekly_member_records_report_member_key unique (report_id, member_id),
  constraint weekly_member_records_week_starts_monday check (extract(isodow from week_start_date) = 1),
  constraint weekly_member_records_report_date_in_week check (
    report_date is null or report_date between week_start_date and week_start_date + 6
  ),
  constraint weekly_member_records_confidence_valid check (
    prayer_parse_confidence is null or prayer_parse_confidence between 0 and 1
  )
);

create table public.member_notes (
  note_id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete restrict,
  note text not null,
  recorded_date date not null default current_date,
  recorded_by uuid not null references public.users(user_id) on delete restrict,
  resolved boolean not null default false,
  resolved_date date,
  resolved_by uuid references public.users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_notes_note_not_blank check (btrim(note) <> ''),
  constraint member_notes_resolution_consistent check (
    (not resolved and resolved_date is null and resolved_by is null)
    or (resolved and resolved_date is not null and resolved_by is not null)
  )
);

create table public.newcomers (
  newcomer_id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  phone text not null,
  address text,
  visit_motivation text,
  visit_channel text,
  faith_experience text,
  after_service_plan text,
  privacy_agreed boolean not null,
  status public.newcomer_status not null default 'new',
  admin_memo text,
  converted_member_id uuid references public.members(member_id) on delete restrict,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  converted_at timestamptz,
  converted_by uuid references public.users(user_id) on delete set null,
  constraint newcomers_name_not_blank check (btrim(name) <> ''),
  constraint newcomers_phone_not_blank check (btrim(phone) <> ''),
  constraint newcomers_privacy_required check (privacy_agreed),
  constraint newcomers_conversion_consistent check (
    (status <> 'converted' and converted_member_id is null and converted_at is null and converted_by is null)
    or (status = 'converted' and converted_member_id is not null and converted_at is not null and converted_by is not null)
  )
);

create table public.absence_alerts (
  alert_id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete restrict,
  cell_id uuid references public.cells(cell_id) on delete restrict,
  last_attended_date date,
  absence_months integer,
  status public.absence_alert_status not null default 'open',
  memo text,
  created_at timestamptz not null default now(),
  checked_at timestamptz,
  checked_by uuid references public.users(user_id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid references public.users(user_id) on delete set null,
  constraint absence_alerts_months_nonnegative check (absence_months is null or absence_months >= 0),
  constraint absence_alerts_checked_consistent check (
    status <> 'checked' or (checked_at is not null and checked_by is not null)
  ),
  constraint absence_alerts_resolved_consistent check (
    status <> 'resolved' or (resolved_at is not null and resolved_by is not null)
  )
);

create unique index absence_alerts_one_open_per_member
  on public.absence_alerts (member_id)
  where status = 'open';

create table public.settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(user_id) on delete set null,
  constraint settings_key_not_blank check (btrim(key) <> '')
);

create table public.audit_logs (
  log_id uuid primary key default extensions.gen_random_uuid(),
  action public.audit_action not null,
  target_type text not null,
  target_id uuid not null,
  changed_by uuid references public.users(user_id) on delete set null,
  changed_at timestamptz not null default now(),
  before_value jsonb,
  after_value jsonb,
  memo text,
  constraint audit_logs_target_type_not_blank check (btrim(target_type) <> '')
);

create index user_cell_assignments_user_active_idx
  on public.user_cell_assignments (user_id, active, start_date, end_date);
create index user_cell_assignments_cell_active_idx
  on public.user_cell_assignments (cell_id, active);
create index members_current_cell_status_idx on public.members (current_cell_id, status);
create index members_name_search_idx on public.members (lower(full_name), lower(display_name));
create index cell_member_history_member_start_idx on public.cell_member_history (member_id, start_date desc);
create index weekly_cell_reports_cell_week_idx on public.weekly_cell_reports (cell_id, week_start_date desc);
create index weekly_member_records_member_week_idx on public.weekly_member_records (member_id, week_start_date desc);
create index weekly_member_records_cell_week_idx on public.weekly_member_records (cell_id, week_start_date desc);
create index member_notes_member_resolved_idx on public.member_notes (member_id, resolved, recorded_date desc);
create index newcomers_status_submitted_idx on public.newcomers (status, submitted_at desc);
create index absence_alerts_cell_status_idx on public.absence_alerts (cell_id, status);
create index audit_logs_target_idx on public.audit_logs (target_type, target_id, changed_at desc);
create index audit_logs_changed_at_idx on public.audit_logs (changed_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();
create trigger cells_set_updated_at before update on public.cells
for each row execute function public.set_updated_at();
create trigger user_cell_assignments_set_updated_at before update on public.user_cell_assignments
for each row execute function public.set_updated_at();
create trigger members_set_updated_at before update on public.members
for each row execute function public.set_updated_at();
create trigger weekly_cell_reports_set_updated_at before update on public.weekly_cell_reports
for each row execute function public.set_updated_at();
create trigger weekly_member_records_set_updated_at before update on public.weekly_member_records
for each row execute function public.set_updated_at();
create trigger member_notes_set_updated_at before update on public.member_notes
for each row execute function public.set_updated_at();
create trigger newcomers_set_updated_at before update on public.newcomers
for each row execute function public.set_updated_at();
create trigger settings_set_updated_at before update on public.settings
for each row execute function public.set_updated_at();

insert into public.settings (key, value, description)
values
  ('church_name', 'Bluelight 홍대교회', '교회명'),
  ('app_name', 'BLC Care', '앱 이름'),
  ('long_absence_months', '3', '장기결석 기준 개월 수'),
  ('report_edit_deadline_day', 'Sunday', '리포트 수정 가능 마감 요일'),
  ('timezone', 'Asia/Seoul', '기준 시간대');

create function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select user_id
  from public.users
  where auth_user_id = auth.uid()
    and active
  limit 1
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select 'admin' = any(roles)
      from public.users
      where auth_user_id = auth.uid()
        and active
      limit 1
    ),
    false
  )
$$;

create function public.can_access_cell(target_cell_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.user_cell_assignments a
    join public.users u on u.user_id = a.user_id
    where u.auth_user_id = auth.uid()
      and u.active
      and 'cell_leader' = any(u.roles)
      and a.cell_id = target_cell_id
      and a.active
      and (a.start_date is null or a.start_date <= current_date)
      and (a.end_date is null or a.end_date >= current_date)
  )
$$;

create function public.can_access_member(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.members m
    where m.member_id = target_member_id
      and m.current_cell_id is not null
      and public.can_access_cell(m.current_cell_id)
  )
$$;

create function public.can_edit_report(
  target_cell_id uuid,
  target_week_start_date date,
  target_week_end_date date,
  target_locked boolean,
  target_status public.report_status
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or (
    public.can_access_cell(target_cell_id)
    and not target_locked
    and target_status <> 'locked'
    and current_date between target_week_start_date and target_week_end_date
  )
$$;

revoke all on function public.current_app_user_id() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.can_access_cell(uuid) from public;
revoke all on function public.can_access_member(uuid) from public;
revoke all on function public.can_edit_report(uuid, date, date, boolean, public.report_status) from public;
grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_access_cell(uuid) to authenticated;
grant execute on function public.can_access_member(uuid) to authenticated;
grant execute on function public.can_edit_report(uuid, date, date, boolean, public.report_status) to authenticated;

alter table public.users enable row level security;
alter table public.cells enable row level security;
alter table public.user_cell_assignments enable row level security;
alter table public.members enable row level security;
alter table public.cell_member_history enable row level security;
alter table public.weekly_cell_reports enable row level security;
alter table public.weekly_member_records enable row level security;
alter table public.member_notes enable row level security;
alter table public.newcomers enable row level security;
alter table public.absence_alerts enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;

create policy users_select_self_or_admin on public.users
for select to authenticated
using ((auth_user_id = auth.uid() and active) or public.is_admin());
create policy users_admin_all on public.users
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy cells_select_accessible on public.cells
for select to authenticated
using (public.can_access_cell(cell_id));
create policy cells_admin_all on public.cells
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy assignments_select_accessible on public.user_cell_assignments
for select to authenticated
using (public.can_access_cell(cell_id));
create policy assignments_admin_all on public.user_cell_assignments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy members_select_accessible on public.members
for select to authenticated
using (current_cell_id is not null and public.can_access_cell(current_cell_id));
create policy members_admin_all on public.members
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy cell_history_select_accessible on public.cell_member_history
for select to authenticated
using (public.can_access_member(member_id));
create policy cell_history_admin_all on public.cell_member_history
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy reports_select_accessible on public.weekly_cell_reports
for select to authenticated
using (public.can_access_cell(cell_id));
create policy reports_insert_accessible on public.weekly_cell_reports
for insert to authenticated
with check (
  public.can_edit_report(cell_id, week_start_date, week_end_date, locked, status)
  and leader_user_id = public.current_app_user_id()
);
create policy reports_update_accessible on public.weekly_cell_reports
for update to authenticated
using (public.can_edit_report(cell_id, week_start_date, week_end_date, locked, status))
with check (public.can_edit_report(cell_id, week_start_date, week_end_date, locked, status));
create policy reports_admin_all on public.weekly_cell_reports
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy records_select_accessible on public.weekly_member_records
for select to authenticated
using (public.can_access_cell(cell_id));
create policy records_insert_accessible on public.weekly_member_records
for insert to authenticated
with check (
  public.can_access_cell(cell_id)
  and public.can_access_member(member_id)
  and exists (
    select 1
    from public.weekly_cell_reports r
    where r.report_id = weekly_member_records.report_id
      and r.cell_id = weekly_member_records.cell_id
      and r.week_start_date = weekly_member_records.week_start_date
      and public.can_edit_report(r.cell_id, r.week_start_date, r.week_end_date, r.locked, r.status)
  )
);
create policy records_update_accessible on public.weekly_member_records
for update to authenticated
using (
  exists (
    select 1
    from public.weekly_cell_reports r
    where r.report_id = weekly_member_records.report_id
      and public.can_edit_report(r.cell_id, r.week_start_date, r.week_end_date, r.locked, r.status)
  )
)
with check (
  public.can_access_cell(cell_id)
  and public.can_access_member(member_id)
  and exists (
    select 1
    from public.weekly_cell_reports r
    where r.report_id = weekly_member_records.report_id
      and r.cell_id = weekly_member_records.cell_id
      and r.week_start_date = weekly_member_records.week_start_date
      and public.can_edit_report(r.cell_id, r.week_start_date, r.week_end_date, r.locked, r.status)
  )
);
create policy records_admin_all on public.weekly_member_records
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy notes_select_accessible on public.member_notes
for select to authenticated
using (public.can_access_member(member_id));
create policy notes_insert_accessible on public.member_notes
for insert to authenticated
with check (
  public.can_access_member(member_id)
  and recorded_by = public.current_app_user_id()
);
create policy notes_update_accessible on public.member_notes
for update to authenticated
using (public.can_access_member(member_id))
with check (public.can_access_member(member_id));
create policy notes_admin_all on public.member_notes
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy newcomers_admin_all on public.newcomers
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy absence_alerts_select_accessible on public.absence_alerts
for select to authenticated
using (public.is_admin() or (cell_id is not null and public.can_access_cell(cell_id)));
create policy absence_alerts_admin_all on public.absence_alerts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy settings_admin_all on public.settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy audit_logs_admin_select on public.audit_logs
for select to authenticated
using (public.is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
