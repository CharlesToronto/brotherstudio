create table if not exists public.property_valuation_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  property_type text not null,
  property_address text not null,
  room_count text not null,
  approximate_area text,
  contact_time text not null,
  sale_timeline text not null,
  desired_price_chf numeric(14, 2),
  source text not null default 'campaign-landing-valuation',
  created_at timestamptz not null default now(),
  constraint property_valuation_requests_price_nonnegative
    check (desired_price_chf is null or desired_price_chf >= 0)
);

create index if not exists property_valuation_requests_created_at_idx
  on public.property_valuation_requests (created_at desc);

create index if not exists property_valuation_requests_email_created_at_idx
  on public.property_valuation_requests (lower(email), created_at desc);

alter table public.property_valuation_requests enable row level security;

revoke all on table public.property_valuation_requests from public, anon, authenticated;
grant insert on table public.property_valuation_requests to service_role;
