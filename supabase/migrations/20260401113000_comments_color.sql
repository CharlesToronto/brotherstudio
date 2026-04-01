alter table public.comments
  add column if not exists color text;

update public.comments
set color = '#d88fa2'
where color is null
   or btrim(color) = '';

alter table public.comments
  alter column color set not null;

alter table public.comments
  alter column color set default '#d88fa2';
