begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

select has_function(
  'public',
  'import_members_csv',
  array['jsonb', 'text'],
  'member CSV import RPC exists'
);

insert into public.cells (cell_id, cell_name, active)
values
  ('21000000-0000-0000-0000-000000000001', 'CSV 샘플 셀', true),
  ('21000000-0000-0000-0000-000000000002', 'CSV 비활성 셀', false);

set local role service_role;

select is(
  (
    public.import_members_csv(
      jsonb_build_array(
        jsonb_build_object(
          'full_name', 'CSV 샘플 성도',
          'display_name', 'CSV 샘플 성도',
          'name_aliases', jsonb_build_array('샘플'),
          'cell_name', 'CSV 샘플 셀',
          'registration_date', '2026-06-14',
          'status', 'active'
        )
      ),
      'missing-admin@example.invalid'
    )->>'imported_count'
  )::integer,
  1,
  'service role imports one member'
);

select is(
  (select count(*) from public.members where full_name = 'CSV 샘플 성도'),
  1::bigint,
  'import creates a member'
);

select is(
  (
    select count(*)
    from public.cell_member_history h
    join public.members m on m.member_id = h.member_id
    where m.full_name = 'CSV 샘플 성도'
      and h.to_cell_id = '21000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'import creates current cell history'
);

select is(
  (select count(*) from public.audit_logs where target_type = 'members_csv_import'),
  1::bigint,
  'import creates a minimal audit log'
);

select throws_ok(
  $$
    select public.import_members_csv(
      jsonb_build_array(
        jsonb_build_object(
          'full_name', '차단 샘플',
          'name_aliases', jsonb_build_array(),
          'cell_name', 'CSV 비활성 셀',
          'status', 'active'
        )
      ),
      'missing-admin@example.invalid'
    )
  $$,
  'P0001',
  'Unknown or inactive cell at row 1',
  'inactive cell aborts the import'
);

reset role;
set local role authenticated;

select throws_ok(
  $$
    select public.import_members_csv(
      jsonb_build_array(jsonb_build_object('full_name', '권한 차단 샘플')),
      'missing-admin@example.invalid'
    )
  $$,
  '42501',
  null,
  'authenticated role cannot call service-only import RPC'
);

select * from finish();
rollback;
