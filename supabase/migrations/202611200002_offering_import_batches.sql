-- Existing imports did not carry a batch identifier. Preserve them as one-row
-- batches so removing an old record can never remove unrelated transactions.
create table public.offering_import_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid not null references public.offering_accounts(id) on delete restrict,
  created_by uuid not null references public.users(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  transaction_count integer not null check (transaction_count between 1 and 500),
  first_date date not null,
  last_date date not null,
  deleted_at timestamptz,
  deleted_by uuid references public.users(user_id) on delete restrict,
  check ((deleted_at is null) = (deleted_by is null)),
  check (first_date <= last_date)
);
alter table public.offering_transactions add column batch_id uuid;
update public.offering_transactions set batch_id = extensions.gen_random_uuid();
insert into public.offering_import_batches(id, account_id, created_by, created_at, transaction_count, first_date, last_date)
select batch_id, account_id, created_by, created_at, 1, transaction_date, transaction_date from public.offering_transactions;
alter table public.offering_transactions alter column batch_id set not null;
alter table public.offering_transactions add constraint offering_transactions_batch_fk foreign key (batch_id) references public.offering_import_batches(id) on delete restrict;
create index offering_transactions_batch_idx on public.offering_transactions(batch_id);
alter table public.offering_import_batches enable row level security;
revoke all on public.offering_import_batches from public, anon, authenticated;
grant select on public.offering_import_batches to authenticated;
create policy offering_batches_admin_read on public.offering_import_batches for select to authenticated using (public.is_admin());
-- All new writes go through an atomic batch RPC, not direct table inserts.
revoke insert on public.offering_transactions from authenticated;
revoke insert (account_id, transaction_date, transaction_time, description, details, withdrawal, deposit, category, member_id, purpose) on public.offering_transactions from authenticated;

create function public.save_offering_import(p_account_id uuid, p_rows jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_batch uuid; v_actor uuid; v_count integer; v_first date; v_last date;
begin
  if not public.is_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  v_actor := public.current_app_user_id();
  if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Invalid rows' using errcode = '22023'; end if;
  v_count := jsonb_array_length(p_rows);
  if v_count < 1 or v_count > 500 then raise exception 'Invalid row count' using errcode = '22023'; end if;
  select min(x.transaction_date), max(x.transaction_date) into v_first, v_last
  from jsonb_to_recordset(p_rows) as x(transaction_date date);
  insert into public.offering_import_batches(account_id, created_by, transaction_count, first_date, last_date)
  values (p_account_id, v_actor, v_count, v_first, v_last) returning id into v_batch;
  insert into public.offering_transactions(batch_id, account_id, transaction_date, transaction_time, description, details, withdrawal, deposit, category, member_id, purpose, created_by)
  select v_batch, p_account_id, x.transaction_date, x.transaction_time, x.description, x.details, x.withdrawal, x.deposit, x.category, x.member_id, coalesce(x.purpose, ''), v_actor
  from jsonb_to_recordset(p_rows) as x(transaction_date date, transaction_time time, description text, details text, withdrawal bigint, deposit bigint, category text, member_id uuid, purpose text);
  return v_batch;
end;
$$;

create function public.delete_offering_import(p_batch_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid;
begin
  if not public.is_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  v_actor := public.current_app_user_id();
  perform 1 from public.offering_import_batches where id = p_batch_id and deleted_at is null for update;
  if not found then raise exception 'Import not found' using errcode = 'P0002'; end if;
  delete from public.offering_transactions where batch_id = p_batch_id;
  update public.offering_import_batches set deleted_at = now(), deleted_by = v_actor where id = p_batch_id;
end;
$$;
revoke all on function public.save_offering_import(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.delete_offering_import(uuid) from public, anon, authenticated;
grant execute on function public.save_offering_import(uuid, jsonb) to authenticated;
grant execute on function public.delete_offering_import(uuid) to authenticated;

create or replace function public.audit_offering_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(action, target_type, target_id, changed_by)
  values (case when tg_op = 'INSERT' then 'create'::public.audit_action when tg_op = 'DELETE' then 'delete'::public.audit_action else 'update'::public.audit_action end,
          tg_table_name, case when tg_op = 'DELETE' then old.id else new.id end, public.current_app_user_id());
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger audit_offering_transaction_deletes after delete on public.offering_transactions for each row execute function public.audit_offering_change();
create trigger audit_offering_batches after insert or update on public.offering_import_batches for each row execute function public.audit_offering_change();
