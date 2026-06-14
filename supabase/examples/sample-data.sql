-- BLC Care sample data for all 12 application tables.
-- This file is documentation/example data. Review before running it in any database.
-- All people, contact details, care notes, and prayer text below are fictional samples.

begin;

-- 1. users
-- auth_user_id stays null until a real Supabase Auth account is linked.
insert into public.users (user_id, auth_user_id, email, name, roles, active)
values
  (
    '10000000-0000-0000-0000-000000000001',
    null,
    'sample-admin@example.invalid',
    '샘플 관리자',
    array['admin'],
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    null,
    'sample-leader@example.invalid',
    '샘플 셀리더',
    array['cell_leader'],
    true
  )
on conflict (user_id) do nothing;

-- 2. cells
insert into public.cells (cell_id, cell_name, active, sort_order)
values
  ('20000000-0000-0000-0000-000000000001', '샘플 1셀', true, 1),
  ('20000000-0000-0000-0000-000000000002', '샘플 2셀', true, 2)
on conflict (cell_id) do nothing;

-- 3. user_cell_assignments
insert into public.user_cell_assignments (
  assignment_id,
  user_id,
  cell_id,
  assignment_role,
  active,
  start_date,
  end_date
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'leader',
    true,
    '2026-01-01',
    null
  )
on conflict (assignment_id) do nothing;

-- 4. members
insert into public.members (
  member_id,
  full_name,
  display_name,
  name_aliases,
  phone,
  birth_date,
  first_visit_date,
  registration_date,
  address,
  workplace,
  occupation,
  job_title,
  faith_start_year,
  bible_study_status,
  baptism_status,
  family_info,
  current_cell_id,
  status,
  memo,
  created_by,
  updated_by
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '홍길동',
    '홍길동',
    array['길동', '길동형제'],
    '010-0000-0000',
    '1990-01-01',
    '2026-01-04',
    '2026-01-11',
    '서울시 샘플구',
    '샘플 회사',
    '샘플 직업',
    '샘플 직책',
    2020,
    'in_progress',
    'not_baptized',
    '샘플 가족 정보',
    '20000000-0000-0000-0000-000000000001',
    'active',
    '샘플 기본 메모',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '김철수',
    '김철수',
    array['철수'],
    '010-0000-0000',
    null,
    '2026-02-01',
    '2026-02-08',
    null,
    null,
    null,
    null,
    null,
    'unknown',
    'unknown',
    null,
    '20000000-0000-0000-0000-000000000001',
    'active',
    null,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  )
on conflict (member_id) do nothing;

-- 5. cell_member_history
insert into public.cell_member_history (
  history_id,
  member_id,
  from_cell_id,
  to_cell_id,
  start_date,
  end_date,
  reason,
  changed_by
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    null,
    '20000000-0000-0000-0000-000000000001',
    '2026-01-11',
    null,
    '샘플 최초 배정',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    null,
    '20000000-0000-0000-0000-000000000001',
    '2026-02-08',
    null,
    '샘플 최초 배정',
    '10000000-0000-0000-0000-000000000001'
  )
on conflict (history_id) do nothing;

-- 6. weekly_cell_reports
-- week_start_date must be Monday and week_end_date must be six days later.
insert into public.weekly_cell_reports (
  report_id,
  week_start_date,
  week_end_date,
  report_date,
  cell_id,
  leader_user_id,
  overall_summary,
  status,
  locked,
  submitted_at
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '2026-06-08',
    '2026-06-14',
    '2026-06-14',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '샘플 셀 모임 요약',
    'submitted',
    false,
    '2026-06-14 12:00:00+09'
  )
on conflict (report_id) do nothing;

-- 7. weekly_member_records
insert into public.weekly_member_records (
  record_id,
  report_id,
  member_id,
  cell_id,
  week_start_date,
  report_date,
  attendance_status,
  absence_reason,
  sharing_summary,
  prayer_request,
  support_suggestion,
  prayer_source_text,
  prayer_parsed_by,
  prayer_parse_confidence,
  created_by,
  updated_by
)
values
  (
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '2026-06-08',
    '2026-06-14',
    'present',
    null,
    '샘플 나눔 요약',
    '샘플 기도제목',
    '샘플 지원 제안',
    '길동: 샘플 기도제목',
    'rule',
    1.0000,
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '2026-06-08',
    '2026-06-14',
    'excused',
    '샘플 결석 사유',
    null,
    null,
    null,
    null,
    'manual',
    null,
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002'
  )
on conflict (record_id) do nothing;

-- 8. member_notes
insert into public.member_notes (
  note_id,
  member_id,
  note,
  recorded_date,
  recorded_by,
  resolved,
  resolved_date,
  resolved_by
)
values
  (
    '80000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '샘플 돌봄 메모',
    '2026-06-14',
    '10000000-0000-0000-0000-000000000002',
    false,
    null,
    null
  )
on conflict (note_id) do nothing;

-- 9. newcomers
insert into public.newcomers (
  newcomer_id,
  name,
  phone,
  address,
  visit_motivation,
  visit_channel,
  faith_experience,
  after_service_plan,
  privacy_agreed,
  status,
  admin_memo
)
values
  (
    '90000000-0000-0000-0000-000000000001',
    '박영희',
    '010-0000-0000',
    '서울시 샘플구',
    '샘플 방문 동기',
    '샘플 방문 경로',
    '샘플 신앙 경험',
    '샘플 예배 이후 일정',
    true,
    'new',
    '샘플 관리자 메모'
  )
on conflict (newcomer_id) do nothing;

-- 10. absence_alerts
insert into public.absence_alerts (
  alert_id,
  member_id,
  cell_id,
  last_attended_date,
  absence_months,
  status,
  memo
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '2026-03-01',
    3,
    'open',
    '샘플 확인 메모'
  )
on conflict (alert_id) do nothing;

-- 11. settings
-- The migration already creates the standard settings. This adds an example custom setting.
insert into public.settings (key, value, description, updated_by)
values (
  'sample_feature_enabled',
  'false',
  '샘플 설정값',
  '10000000-0000-0000-0000-000000000001'
)
on conflict (key) do nothing;

-- 12. audit_logs
-- Do not copy names, phone numbers, addresses, prayer requests, or care notes into audit values.
insert into public.audit_logs (
  log_id,
  action,
  target_type,
  target_id,
  changed_by,
  before_value,
  after_value,
  memo
)
values (
  'b0000000-0000-0000-0000-000000000001',
  'create',
  'cells',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  null,
  jsonb_build_object('active', true, 'sort_order', 1),
  '샘플 생성 로그'
)
on conflict (log_id) do nothing;

commit;
