create table public.estate_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  locale text not null check (locale in ('fr', 'en')),
  created_at timestamptz not null default now()
);
create index estate_newsletter_created on public.estate_newsletter_subscribers(created_at desc, id);
alter table public.estate_newsletter_subscribers enable row level security;
revoke all on public.estate_newsletter_subscribers from public, anon, authenticated;
grant select, insert on public.estate_newsletter_subscribers to service_role;
