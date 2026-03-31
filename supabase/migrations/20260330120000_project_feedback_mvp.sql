create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'in_review',
  access_password text not null default '1870',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_status_check'
  ) then
    alter table public.projects
      add constraint projects_status_check
      check (status in ('in_review', 'approved'));
  end if;
end
$$;

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  project_name text not null,
  url text not null,
  version integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_id uuid not null references public.images(id) on delete cascade,
  x double precision not null,
  y double precision not null,
  author text not null default 'Guest',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists images_project_version_idx
  on public.images (project_id, version desc, created_at desc);

create or replace function public.set_image_project_name_from_project()
returns trigger
language plpgsql
as $$
begin
  select p.name
  into new.project_name
  from public.projects p
  where p.id = new.project_id;

  if new.project_name is null then
    raise exception 'Project % not found for image row.', new.project_id;
  end if;

  return new;
end;
$$;

drop trigger if exists images_set_project_name_trigger on public.images;

create trigger images_set_project_name_trigger
before insert or update of project_id
on public.images
for each row
execute function public.set_image_project_name_from_project();

create or replace function public.sync_project_name_to_images()
returns trigger
language plpgsql
as $$
begin
  if new.name is distinct from old.name then
    update public.images
    set project_name = new.name
    where project_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists projects_sync_name_to_images_trigger on public.projects;

create trigger projects_sync_name_to_images_trigger
after update of name
on public.projects
for each row
execute function public.sync_project_name_to_images();

create index if not exists comments_project_created_idx
  on public.comments (project_id, created_at asc);

create index if not exists comments_image_created_idx
  on public.comments (image_id, created_at asc);

alter table public.projects enable row level security;
alter table public.images enable row level security;
alter table public.comments enable row level security;

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;
