do $$
begin
  if to_regclass('public.dashboard_projects') is null then
    raise notice 'Skipping dashboard repair because dashboard_projects is missing.';
    return;
  end if;

  alter table public.dashboard_projects
    add column if not exists client_website text not null default '',
    add column if not exists payment_status text;

  update public.dashboard_projects
  set payment_status = case
    when status = 'En attente de payment' then 'En attente de payment'
    when status in ('À facturer', 'En attente') then 'À facturer'
    when invoiced_amount > 0 and upcoming_amount <= 0 then 'Reçu'
    else 'À facturer'
  end
  where payment_status is null;

  update public.dashboard_projects
  set status = case
    when status = 'Réalisé' then 'Terminé'
    when status in ('En cours', 'À venir', 'Terminé') then status
    when expected_date is not null and expected_date > current_date then 'À venir'
    else 'En cours'
  end;

  alter table public.dashboard_projects
    alter column payment_status set default 'À facturer',
    alter column payment_status set not null;

  alter table public.dashboard_projects
    drop constraint if exists dashboard_projects_status_check;

  alter table public.dashboard_projects
    add constraint dashboard_projects_status_check
    check (status in ('En cours', 'À venir', 'Terminé'));

  alter table public.dashboard_projects
    drop constraint if exists dashboard_projects_payment_status_check;

  alter table public.dashboard_projects
    add constraint dashboard_projects_payment_status_check
    check (payment_status in ('Reçu', 'À facturer', 'En attente de payment'));
end
$$;

notify pgrst, 'reload schema';
