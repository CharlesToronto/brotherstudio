do $$
begin
  if to_regclass('public.dashboard_projects') is null then
    raise notice 'Skipping dashboard_projects update because dashboard_projects is missing.';
    return;
  end if;

  if to_regclass('public.team_clients') is not null then
    execute '
      alter table public.dashboard_projects
      add column if not exists team_client_id uuid references public.team_clients(id) on delete set null
    ';
  else
    raise notice 'Skipping dashboard_projects.team_client_id because team_clients is missing.';
  end if;

  execute '
    alter table public.dashboard_projects
    add column if not exists service_types text[] not null default ''{}''::text[]
  ';

  execute '
    alter table public.dashboard_projects
    drop constraint if exists dashboard_projects_status_check
  ';

  execute '
    alter table public.dashboard_projects
    add constraint dashboard_projects_status_check
    check (status in (
      ''Réalisé'',
      ''En cours'',
      ''À venir'',
      ''En attente'',
      ''En attente de payment'',
      ''Terminé''
    ))
  ';
end
$$;
