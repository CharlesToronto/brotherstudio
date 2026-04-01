create table if not exists public.image_team_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_id uuid not null references public.images(id) on delete cascade,
  reply_to_id uuid references public.image_team_messages(id) on delete set null,
  author text not null default 'Team',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists image_team_messages_project_created_idx
  on public.image_team_messages (project_id, created_at asc);

create index if not exists image_team_messages_image_created_idx
  on public.image_team_messages (image_id, created_at asc);

alter table public.image_team_messages enable row level security;
