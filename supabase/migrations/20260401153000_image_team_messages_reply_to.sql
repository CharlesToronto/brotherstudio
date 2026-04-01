alter table public.image_team_messages
  add column if not exists reply_to_id uuid references public.image_team_messages(id) on delete set null;
