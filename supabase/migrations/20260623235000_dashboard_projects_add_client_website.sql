do $$
begin
  if to_regclass('public.dashboard_projects') is null then
    raise notice 'Skipping dashboard_projects website migration because dashboard_projects is missing.';
    return;
  end if;

  alter table public.dashboard_projects
    add column if not exists client_website text not null default '';
end
$$;
