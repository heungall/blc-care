begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

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
select lives_ok($$insert into public.offering_transactions (account_id, transaction_date, transaction_time, description, details, withdrawal, deposit, category, member_id) values ('50000000-0000-0000-0000-000000000011', '2026-01-01', '12:00:00', '이체', '홍길동', 0, 100, 'offering', '40000000-0000-0000-0000-000000000011')$$, 'admin can record a confirmed offering');
select is((select count(*) from public.offering_transactions), 1::bigint, 'admin can read transactions');
select throws_ok($$insert into public.offering_transactions (account_id, transaction_date, transaction_time, description, details, withdrawal, deposit, category, member_id) values ('50000000-0000-0000-0000-000000000011', '2026-01-01', '12:00:00', '이체', '홍길동', 0, 100, 'offering', '40000000-0000-0000-0000-000000000011')$$, '23505', null, 'duplicate transaction rejected');
select throws_ok($$insert into public.offering_transactions (account_id, transaction_date, transaction_time, description, details, withdrawal, deposit, category) values ('50000000-0000-0000-0000-000000000011', '2026-01-02', '12:00:00', '이체', '샘플', 0, 100, 'offering')$$, '23514', null, 'offering requires a member');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select is((select count(*) from public.offering_accounts), 0::bigint, 'leader cannot read accounts');
select is((select count(*) from public.offering_transactions), 0::bigint, 'leader cannot read transactions');
select throws_ok($$insert into public.offering_accounts (name, purpose) values ('샘플', '샘플')$$, '42501', null, 'leader cannot create accounts');
select * from finish();
rollback;
