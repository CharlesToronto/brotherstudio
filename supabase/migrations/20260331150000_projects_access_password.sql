alter table public.projects
  add column if not exists access_password text;

update public.projects
set access_password = '1870'
where access_password is null
   or btrim(access_password) = '';

alter table public.projects
  alter column access_password set not null;

alter table public.projects
  alter column access_password set default '1870';
