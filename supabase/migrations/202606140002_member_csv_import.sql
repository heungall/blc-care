create function public.import_members_csv(
  p_rows jsonb,
  p_actor_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  actor_id uuid;
  cell_id uuid;
  member_id uuid;
  imported_ids jsonb := '[]'::jsonb;
  imported_count integer := 0;
  target_cell_name text;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Rows must be a JSON array';
  end if;

  if jsonb_array_length(p_rows) = 0 or jsonb_array_length(p_rows) > 500 then
    raise exception 'Import must contain between 1 and 500 rows';
  end if;

  select u.user_id
  into actor_id
  from public.users u
  where lower(u.email) = lower(p_actor_email)
    and u.active
    and 'admin' = any(u.roles)
  limit 1;

  for item in select value from jsonb_array_elements(p_rows)
  loop
    imported_count := imported_count + 1;
    target_cell_name := nullif(btrim(item->>'cell_name'), '');
    cell_id := null;

    if nullif(btrim(item->>'full_name'), '') is null then
      raise exception 'Missing full_name at row %', imported_count;
    end if;

    if target_cell_name is not null then
      select c.cell_id
      into cell_id
      from public.cells c
      where lower(c.cell_name) = lower(target_cell_name)
        and c.active
      limit 1;

      if cell_id is null then
        raise exception 'Unknown or inactive cell at row %', imported_count;
      end if;
    end if;

    insert into public.members (
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
    values (
      btrim(item->>'full_name'),
      coalesce(nullif(btrim(item->>'display_name'), ''), btrim(item->>'full_name')),
      array(select jsonb_array_elements_text(coalesce(item->'name_aliases', '[]'::jsonb))),
      nullif(btrim(item->>'phone'), ''),
      nullif(item->>'birth_date', '')::date,
      nullif(item->>'first_visit_date', '')::date,
      nullif(item->>'registration_date', '')::date,
      nullif(btrim(item->>'address'), ''),
      nullif(btrim(item->>'workplace'), ''),
      nullif(btrim(item->>'occupation'), ''),
      nullif(btrim(item->>'job_title'), ''),
      nullif(item->>'faith_start_year', '')::smallint,
      nullif(item->>'bible_study_status', '')::public.bible_study_status,
      nullif(item->>'baptism_status', '')::public.baptism_status,
      nullif(btrim(item->>'family_info'), ''),
      cell_id,
      coalesce(nullif(item->>'status', ''), 'active')::public.member_status,
      nullif(btrim(item->>'memo'), ''),
      actor_id,
      actor_id
    )
    returning members.member_id into member_id;

    if cell_id is not null then
      insert into public.cell_member_history (
        member_id,
        from_cell_id,
        to_cell_id,
        start_date,
        reason,
        changed_by
      )
      values (
        member_id,
        null,
        cell_id,
        coalesce(
          nullif(item->>'registration_date', '')::date,
          nullif(item->>'first_visit_date', '')::date,
          current_date
        ),
        'CSV bulk import',
        actor_id
      );
    end if;

    imported_ids := imported_ids || jsonb_build_array(member_id);
  end loop;

  insert into public.audit_logs (
    action,
    target_type,
    target_id,
    changed_by,
    after_value,
    memo
  )
  values (
    'create',
    'members_csv_import',
    extensions.gen_random_uuid(),
    actor_id,
    jsonb_build_object('imported_count', imported_count),
    'Member CSV bulk import'
  );

  return jsonb_build_object(
    'imported_count', imported_count,
    'member_ids', imported_ids
  );
end;
$$;

revoke all on function public.import_members_csv(jsonb, text) from public;
revoke all on function public.import_members_csv(jsonb, text) from anon;
revoke all on function public.import_members_csv(jsonb, text) from authenticated;
grant execute on function public.import_members_csv(jsonb, text) to service_role;
