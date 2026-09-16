alter table public.projects
  add column if not exists address text not null default '',
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.projects
  drop constraint if exists projects_latitude_check;

alter table public.projects
  add constraint projects_latitude_check
  check (latitude is null or latitude between -90 and 90);

alter table public.projects
  drop constraint if exists projects_longitude_check;

alter table public.projects
  add constraint projects_longitude_check
  check (longitude is null or longitude between -180 and 180);
