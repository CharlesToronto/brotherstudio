do $$
begin
  if to_regclass('public.dashboard_projects') is null then
    raise notice 'Skipping dashboard_projects expected_date migration because dashboard_projects is missing.';
    return;
  end if;

  execute '
    alter table public.dashboard_projects
    alter column expected_date drop not null
  ';
end
$$;
