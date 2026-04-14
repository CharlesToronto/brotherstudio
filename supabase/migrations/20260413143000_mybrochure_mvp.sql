create table if not exists public.brochure_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  template text not null default 'modern',
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  heading_color text not null default '#111111',
  body_color text not null default '#5f5f5f',
  accent_color text not null default '#c40018',
  font_family text not null default 'helvetica',
  selected_image_ids jsonb not null default '[]'::jsonb,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brochure_settings_template_check
    check (template in ('minimal', 'modern', 'luxury')),
  constraint brochure_settings_font_family_check
    check (font_family in ('helvetica', 'garamond', 'georgia', 'times')),
  constraint brochure_settings_selected_image_ids_check
    check (jsonb_typeof(selected_image_ids) = 'array')
);

create table if not exists public.brochure_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null default 'extra',
  url text not null,
  file_name text not null default '',
  created_at timestamptz not null default now(),
  constraint brochure_assets_kind_check check (kind in ('extra'))
);

create index if not exists brochure_assets_project_created_at_idx
  on public.brochure_assets(project_id, created_at desc);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'brochure-assets',
  'brochure-assets',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
