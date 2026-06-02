do $$
begin
  if to_regclass('public.dashboard_projects') is null then
    raise notice 'Skipping dashboard_projects backfill because dashboard_projects is missing.';
    return;
  end if;

  execute '
    alter table public.dashboard_projects
    add column if not exists client_email text not null default ''''
  ';

  execute '
    alter table public.dashboard_projects
    add column if not exists client_phone text not null default ''''
  ';
end
$$;
