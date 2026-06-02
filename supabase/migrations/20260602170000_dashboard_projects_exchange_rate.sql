do $$
begin
  if to_regclass('public.dashboard_projects') is null then
    raise notice 'Skipping dashboard_projects exchange rate migration because dashboard_projects is missing.';
    return;
  end if;

  execute '
    alter table public.dashboard_projects
    add column if not exists exchange_rate_to_cad numeric(10, 4) not null default 1.66
  ';

  execute '
    update public.dashboard_projects
    set exchange_rate_to_cad = 1
    where currency = ''CAD''
  ';

  execute '
    update public.dashboard_projects
    set exchange_rate_to_cad = 1.66
    where currency = ''CHF'' and (exchange_rate_to_cad is null or exchange_rate_to_cad <= 0)
  ';
end
$$;
