do $$
begin
  if to_regclass('public.dashboard_projects') is null then
    raise notice 'Skipping dashboard request details migration because dashboard_projects is missing.';
    return;
  end if;

  alter table public.dashboard_projects
    add column if not exists deliverables jsonb not null default '[]'::jsonb,
    add column if not exists request_summary text not null default '',
    add column if not exists request_details text not null default '',
    add column if not exists request_email_url text not null default '',
    add column if not exists request_pdf_url text not null default '',
    add column if not exists request_pdf_name text not null default '';
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dashboard-request-documents',
  'dashboard-request-documents',
  true,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
