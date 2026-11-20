begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-000000000011', 'offering-admin@example.invalid'),
 ('00000000-0000-0000-0000-000000000012', 'offering-leader@example.invalid');
insert into public.users (user_id, auth_user_id, email, name, roles, active) values
 ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'offering-admin@example.invalid', '샘플 관리자', array['admin'], true),
 ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 'offering-leader@example.invalid', '샘플 리더', array['cell_leader'], true);
insert into public.members (member_id, full_name, display_name) values ('40000000-0000-0000-0000-000000000011', '홍길동', '홍길동');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);
select lives_ok($$insert into public.offering_accounts (id, name, purpose) values ('50000000-0000-0000-0000-000000000011', '샘플 계좌', '일반 헌금')$$, 'admin can create an account');
select lives_ok($$select public.save_offering_import('50000000-0000-0000-0000-000000000011', '[{"transaction_date":"2026-01-01","transaction_time":"12:00:00","description":"이체","details":"홍길동","withdrawal":0,"deposit":100,"category":"offering","member_id":"40000000-0000-0000-0000-000000000011"}]')$$, 'admin can record a confirmed offering');
select is((select count(*) from public.offering_transactions), 1::bigint, 'admin can read transactions');
select throws_ok($$select public.save_offering_import('50000000-0000-0000-0000-000000000011', '[{"transaction_date":"2026-01-01","transaction_time":"12:00:00","description":"이체","details":"홍길동","withdrawal":0,"deposit":100,"category":"offering","member_id":"40000000-0000-0000-0000-000000000011"}]')$$, '23505', null, 'duplicate transaction rejected');
select throws_ok($$select public.save_offering_import('50000000-0000-0000-0000-000000000011', '[{"transaction_date":"2026-01-02","transaction_time":"12:00:00","description":"이체","details":"샘플","withdrawal":0,"deposit":100,"category":"offering"}]')$$, '23514', null, 'offering requires a member');
select is((select count(*) from public.offering_import_batches), 1::bigint, 'failed inserts do not leave empty batches');
select throws_ok($$insert into public.offering_transactions (account_id, transaction_date, transaction_time, description, details, withdrawal, deposit, category, purpose) values ('50000000-0000-0000-0000-000000000011', '2026-01-03', '12:00:00', '이체', '샘플', 0, 100, 'other_income', '샘플')$$, '42501', null, 'direct transaction inserts are forbidden');
select lives_ok($$select public.save_offering_import('50000000-0000-0000-0000-000000000011', '[{"transaction_date":"2026-01-02","transaction_time":"12:00:00","description":"이체","details":"샘플","withdrawal":0,"deposit":100,"category":"other_income","purpose":"샘플"}]')$$, 'second import is saved separately');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select is((select count(*) from public.offering_accounts), 0::bigint, 'leader cannot read accounts');
select is((select count(*) from public.offering_transactions), 0::bigint, 'leader cannot read transactions');
select throws_ok($$insert into public.offering_accounts (name, purpose) values ('샘플', '샘플')$$, '42501', null, 'leader cannot create accounts');
select is((select count(*) from public.offering_import_batches), 0::bigint, 'leader cannot read import batches');
select throws_ok($$select public.delete_offering_import('00000000-0000-0000-0000-000000000000')$$, '42501', null, 'leader cannot delete an import');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);
select lives_ok($$select public.delete_offering_import((select id from public.offering_import_batches where first_date = '2026-01-01'))$$, 'admin can delete an import');
select is((select count(*) from public.offering_transactions), 1::bigint, 'deletion preserves unrelated import transactions');
select is((select count(*) from public.offering_transactions where category = 'offering'), 0::bigint, 'deleted offerings no longer contribute to totals');
select is((select count(*) from public.offering_import_batches where deleted_at is not null and deleted_by = '10000000-0000-0000-0000-000000000011'), 1::bigint, 'deletion metadata remains');
select * from finish();
rollback;
