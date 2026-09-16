create table if not exists public.project_reference_folders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists project_reference_folders_name_idx
  on public.project_reference_folders (project_id, lower(name));

create index if not exists project_reference_folders_project_sort_idx
  on public.project_reference_folders (project_id, sort_order, name);

create table if not exists public.project_reference_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  folder_id uuid not null references public.project_reference_folders(id) on delete cascade,
  title text not null,
  description text not null default '',
  filename text not null,
  url text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_reference_files_project_folder_idx
  on public.project_reference_files (project_id, folder_id, updated_at desc);

create or replace function public.set_project_reference_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists project_reference_folders_updated_at_trigger
  on public.project_reference_folders;

create trigger project_reference_folders_updated_at_trigger
before update on public.project_reference_folders
for each row execute function public.set_project_reference_updated_at();

drop trigger if exists project_reference_files_updated_at_trigger
  on public.project_reference_files;

create trigger project_reference_files_updated_at_trigger
before update on public.project_reference_files
for each row execute function public.set_project_reference_updated_at();

create or replace function public.seed_project_reference_folders()
returns trigger
language plpgsql
as $$
begin
  insert into public.project_reference_folders (project_id, name, is_default, sort_order)
  values
    (new.id, 'Mobilier inspiration', true, 0),
    (new.id, 'Aménagement', true, 1),
    (new.id, 'Vue des environs', true, 2)
  on conflict (project_id, (lower(name))) do nothing;
  return new;
end;
$$;

drop trigger if exists projects_seed_reference_folders_trigger on public.projects;

create trigger projects_seed_reference_folders_trigger
after insert on public.projects
for each row execute function public.seed_project_reference_folders();

insert into public.project_reference_folders (project_id, name, is_default, sort_order)
select projects.id, defaults.name, true, defaults.sort_order
from public.projects
cross join (
  values
    ('Mobilier inspiration'::text, 0),
    ('Aménagement'::text, 1),
    ('Vue des environs'::text, 2)
) as defaults(name, sort_order)
on conflict (project_id, (lower(name))) do nothing;

alter table public.project_reference_folders enable row level security;
alter table public.project_reference_files enable row level security;

insert into storage.buckets (id, name, public)
values ('project-references', 'project-references', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;
