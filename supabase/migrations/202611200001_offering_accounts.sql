create table public.offering_accounts (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  purpose text not null check (length(trim(purpose)) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.offering_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid not null references public.offering_accounts(id) on delete restrict,
  transaction_date date not null,
  transaction_time time not null,
  description text not null check (length(description) <= 120),
  details text not null check (length(trim(details)) between 1 and 200),
  withdrawal bigint not null check (withdrawal between 0 and 1000000000000),
  deposit bigint not null check (deposit between 0 and 1000000000000),
  category text not null check (category in ('offering', 'other_income', 'expense')),
  member_id uuid references public.members(member_id) on delete restrict,
  purpose text not null default '' check (length(purpose) <= 200),
  created_by uuid not null default public.current_app_user_id() references public.users(user_id),
  created_at timestamptz not null default now(),
  check ((deposit > 0 and withdrawal = 0 and category in ('offering', 'other_income')) or (withdrawal > 0 and deposit = 0 and category = 'expense')),
  check ((category = 'offering' and member_id is not null) or (category <> 'offering' and member_id is null)),
  check (category = 'offering' or length(trim(purpose)) > 0),
  unique (account_id, transaction_date, transaction_time, withdrawal, deposit, details)
);
create index offering_transactions_date_idx on public.offering_transactions(transaction_date);
create index offering_transactions_member_date_idx on public.offering_transactions(member_id, transaction_date) where category = 'offering';

alter table public.offering_accounts enable row level security;
alter table public.offering_transactions enable row level security;
revoke all on public.offering_accounts, public.offering_transactions from anon, authenticated;
grant select, insert, update on public.offering_accounts to authenticated;
grant select on public.offering_transactions to authenticated;
grant insert (account_id, transaction_date, transaction_time, description, details, withdrawal, deposit, category, member_id, purpose) on public.offering_transactions to authenticated;
grant update (category, member_id, purpose) on public.offering_transactions to authenticated;
create policy offering_accounts_admin on public.offering_accounts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy offering_transactions_admin on public.offering_transactions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create function public.audit_offering_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(action, target_type, target_id, changed_by)
  values (case when tg_op = 'INSERT' then 'create'::public.audit_action else 'update'::public.audit_action end,
          tg_table_name, new.id, public.current_app_user_id());
  return new;
end;
$$;
revoke all on function public.audit_offering_change() from public;
create trigger audit_offering_accounts after insert or update on public.offering_accounts for each row execute function public.audit_offering_change();
create trigger audit_offering_transactions after insert or update on public.offering_transactions for each row execute function public.audit_offering_change();
