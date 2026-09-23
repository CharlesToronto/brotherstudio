create table if not exists public.project_comment_notification_digests (
  project_id uuid primary key references public.projects(id) on delete cascade,
  pending_until timestamptz,
  last_notified_comment_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists project_comment_notification_digests_pending_idx
  on public.project_comment_notification_digests (pending_until)
  where pending_until is not null;

alter table public.project_comment_notification_digests enable row level security;
