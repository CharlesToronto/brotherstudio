create table if not exists public.image_adjustments (
  project_id uuid not null references public.projects(id) on delete cascade,
  image_id uuid primary key references public.images(id) on delete cascade,
  adjustments jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists image_adjustments_project_id_idx
  on public.image_adjustments (project_id);

alter table public.image_adjustments enable row level security;
