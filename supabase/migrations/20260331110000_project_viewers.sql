create table if not exists public.project_viewers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists project_viewers_project_email_idx
  on public.project_viewers (project_id, email);

create index if not exists project_viewers_project_seen_idx
  on public.project_viewers (project_id, last_seen_at desc);

alter table public.project_viewers enable row level security;
