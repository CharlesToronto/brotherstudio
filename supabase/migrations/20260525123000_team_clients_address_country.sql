do $$
begin
  if to_regclass('public.team_clients') is null then
    raise notice 'Skipping team_clients address/country migration because team_clients is missing.';
    return;
  end if;

  execute 'alter table public.team_clients add column if not exists address text not null default ''''';
  execute 'alter table public.team_clients add column if not exists country text not null default ''''';
end
$$;
