-- Run after 20260920120000_project_prospects.sql.
alter table public.project_prospects
  add column if not exists message text not null default '',
  add column if not exists owner text not null default '',
  add column if not exists language text not null default 'Français',
  add column if not exists temperature text not null default 'warm' check (temperature in ('cold', 'warm', 'hot')),
  add column if not exists activities jsonb not null default '[]'::jsonb check (jsonb_typeof(activities) = 'array'),
  add column if not exists tasks jsonb not null default '[]'::jsonb check (jsonb_typeof(tasks) = 'array');

create index if not exists project_prospects_follow_up_idx
  on public.project_prospects (project_id, next_follow_up_at) where status <> 'not_interested';

-- Keep timestamp generation local to this feature.
create or replace function public.set_project_prospect_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
drop trigger if exists project_prospects_updated_at_trigger on public.project_prospects;
create trigger project_prospects_updated_at_trigger before update on public.project_prospects
for each row execute function public.set_project_prospect_updated_at();
