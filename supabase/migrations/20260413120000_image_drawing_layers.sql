create table if not exists public.image_drawing_layers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_id uuid not null references public.images(id) on delete cascade,
  elements jsonb not null default '[]'::jsonb,
  updated_by text not null default 'Admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists image_drawing_layers_image_id_idx
  on public.image_drawing_layers (image_id);

create index if not exists image_drawing_layers_project_updated_idx
  on public.image_drawing_layers (project_id, updated_at desc);

alter table public.image_drawing_layers enable row level security;
