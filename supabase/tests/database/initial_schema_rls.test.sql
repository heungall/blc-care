begin;

create extension if not exists pgtap with schema extensions;

select plan(28);

select has_table('public', 'users', 'users table exists');
select has_table('public', 'members', 'members table exists');
select has_table('public', 'weekly_cell_reports', 'weekly_cell_reports table exists');
select has_table('public', 'newcomers', 'newcomers table exists');

select ok(
  (select count(*) = 12 from pg_tables where schemaname = 'public' and rowsecurity),
  'all 12 application tables have RLS enabled'
);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@example.invalid'),
  ('00000000-0000-0000-0000-000000000002', 'leader@example.invalid'),
  ('00000000-0000-0000-0000-000000000003', 'other@example.invalid'),
  ('00000000-0000-0000-0000-000000000004', 'inactive@example.invalid');

insert into public.users (user_id, auth_user_id, email, name, roles, active)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@example.invalid', '샘플 관리자', array['admin'], true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'leader@example.invalid', '샘플 리더', array['cell_leader'], true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'other@example.invalid', '다른 리더', array['cell_leader'], true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'inactive@example.invalid', '비활성 사용자', array['admin'], false);

insert into public.cells (cell_id, cell_name, active)
values
  ('20000000-0000-0000-0000-000000000001', '샘플 1셀', true),
  ('20000000-0000-0000-0000-000000000002', '샘플 2셀', true);

insert into public.user_cell_assignments (assignment_id, user_id, cell_id, assignment_role, active)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'leader', true),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'leader', true);

insert into public.members (member_id, full_name, display_name, current_cell_id)
values
  ('40000000-0000-0000-0000-000000000001', '샘플가온', '샘플가온', '20000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '샘플나래', '샘플나래', '20000000-0000-0000-0000-000000000002');

insert into public.weekly_cell_reports (
  report_id,
  week_start_date,
  week_end_date,
  cell_id,
  leader_user_id
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    date_trunc('week', current_date)::date,
    date_trunc('week', current_date)::date + 6,
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    date_trunc('week', current_date)::date,
    date_trunc('week', current_date)::date + 6,
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003'
  );

insert into public.newcomers (newcomer_id, name, phone, privacy_agreed)
values ('50000000-0000-0000-0000-000000000001', '샘플새신자', '010-0000-0000', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);

select is(public.current_app_user_id(), '10000000-0000-0000-0000-000000000002'::uuid, 'active auth user maps to app user');
select ok(not public.is_admin(), 'cell leader is not admin');
select ok(public.can_access_cell('20000000-0000-0000-0000-000000000001'), 'leader can access assigned cell');
select ok(not public.can_access_cell('20000000-0000-0000-0000-000000000002'), 'leader cannot access unassigned cell');
select is((select count(*) from public.cells), 1::bigint, 'leader sees only assigned cells');
select is((select count(*) from public.members), 1::bigint, 'leader sees only assigned-cell members');
select is((select count(*) from public.weekly_cell_reports), 1::bigint, 'leader sees only assigned-cell reports');
select is(
  (
    with updated as (
      update public.weekly_cell_reports
      set overall_summary = '샘플 요약'
      where report_id = '60000000-0000-0000-0000-000000000001'
      returning 1
    )
    select count(*) from updated
  ),
  1::bigint,
  'leader can update an assigned current-week report'
);
select is(
  (
    with updated as (
      update public.weekly_cell_reports
      set overall_summary = '차단 요약'
      where report_id = '60000000-0000-0000-0000-000000000002'
      returning 1
    )
    select count(*) from updated
  ),
  0::bigint,
  'leader cannot update an unassigned report'
);
select is((select count(*) from public.newcomers), 0::bigint, 'leader cannot read newcomers');
select throws_ok(
  $$insert into public.members (full_name, display_name, current_cell_id) values ('차단샘플', '차단샘플', '20000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'leader cannot create members'
);
select lives_ok(
  $$insert into public.member_notes (member_id, note, recorded_by) values ('40000000-0000-0000-0000-000000000001', '샘플 메모', '10000000-0000-0000-0000-000000000002')$$,
  'leader can add a note to an assigned member'
);
select throws_ok(
  $$insert into public.member_notes (member_id, note, recorded_by) values ('40000000-0000-0000-0000-000000000002', '차단 메모', '10000000-0000-0000-0000-000000000002')$$,
  '42501',
  null,
  'leader cannot add a note to an unassigned member'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

select ok(public.is_admin(), 'admin helper recognizes admin');
select is((select count(*) from public.cells), 2::bigint, 'admin sees all cells');
select is((select count(*) from public.members), 2::bigint, 'admin sees all members');
select is((select count(*) from public.newcomers), 1::bigint, 'admin sees newcomers');
select lives_ok(
  $$insert into public.members (full_name, display_name, current_cell_id) values ('관리샘플', '관리샘플', '20000000-0000-0000-0000-000000000002')$$,
  'admin can create members'
);

reset role;
set local role anon;
select throws_ok(
  $$insert into public.newcomers (name, phone, privacy_agreed) values ('공개샘플', '010-0000-0000', true)$$,
  '42501',
  null,
  'anonymous users cannot insert newcomers directly'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
select is(public.current_app_user_id(), null::uuid, 'inactive user has no app user identity');
select ok(not public.is_admin(), 'inactive admin role grants no admin access');
select is((select count(*) from public.users), 0::bigint, 'inactive user cannot read own app user row');
select is((select count(*) from public.members), 0::bigint, 'inactive user cannot read members');

select * from finish();
rollback;
