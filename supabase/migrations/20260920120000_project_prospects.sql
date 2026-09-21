create table if not exists public.project_prospects (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  source text not null default '',
  interest text not null default '',
  budget text not null default '',
  timeline text not null default '',
  status text not null default 'new' check (status in ('new', 'to_contact', 'contacted', 'qualified', 'visit_scheduled', 'not_interested')),
  notes text not null default '',
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_prospects_project_updated_idx
  on public.project_prospects (project_id, updated_at desc);

create or replace function public.set_project_prospect_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

drop trigger if exists project_prospects_updated_at_trigger on public.project_prospects;
create trigger project_prospects_updated_at_trigger
before update on public.project_prospects
for each row execute function public.set_project_prospect_updated_at();

alter table public.project_prospects enable row level security;
