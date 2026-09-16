alter table public.projects
  add column if not exists map_embed_url text;
