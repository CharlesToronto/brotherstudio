create extension if not exists pgcrypto;

create table if not exists public.dashboard_projects (
  id uuid primary key default gen_random_uuid(),
  client_name text not null default '',
  client_email text not null default '',
  client_phone text not null default '',
  project_name text not null default '',
  status text not null default 'À venir',
  invoiced_amount numeric(12, 2) not null default 0,
  upcoming_amount numeric(12, 2) not null default 0,
  expected_date date not null,
  currency text not null default 'CAD',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint dashboard_projects_status_check
    check (status in ('Réalisé', 'En cours', 'À venir', 'En attente')),
  constraint dashboard_projects_currency_check
    check (currency in ('CAD', 'CHF'))
);

create index if not exists dashboard_projects_expected_date_idx
  on public.dashboard_projects (expected_date asc);

create index if not exists dashboard_projects_status_idx
  on public.dashboard_projects (status);

create or replace function public.set_dashboard_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists dashboard_projects_set_updated_at on public.dashboard_projects;

create trigger dashboard_projects_set_updated_at
before update on public.dashboard_projects
for each row
execute function public.set_dashboard_projects_updated_at();
