alter table public.images
  add column if not exists status text;

update public.images
set status = 'in_review'
where status is null
   or btrim(status) = '';

alter table public.images
  alter column status set not null;

alter table public.images
  alter column status set default 'in_review';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'images_status_check'
  ) then
    alter table public.images
      add constraint images_status_check
      check (status in ('in_review', 'approved'));
  end if;
end
$$;
