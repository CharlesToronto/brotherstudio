alter table public.images
  add column if not exists project_name text;

update public.images
set project_name = public.projects.name
from public.projects
where public.images.project_id = public.projects.id
  and (
    public.images.project_name is null
    or public.images.project_name <> public.projects.name
  );

alter table public.images
  alter column project_name set not null;

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
