do $$
begin
  if to_regclass('public.dashboard_projects') is null then
    raise notice 'Skipping dashboard_projects status rename because dashboard_projects is missing.';
    return;
  end if;

  update public.dashboard_projects
  set status = 'À facturer'
  where status = 'En attente';

  alter table public.dashboard_projects
    drop constraint if exists dashboard_projects_status_check;

  alter table public.dashboard_projects
    add constraint dashboard_projects_status_check
    check (status in (
      'Réalisé',
      'En cours',
      'À venir',
      'À facturer',
      'En attente de payment',
      'Terminé'
    ));
end
$$;
