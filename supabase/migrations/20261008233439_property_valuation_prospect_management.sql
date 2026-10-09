alter table public.property_valuation_requests
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'valuation', 'mandate', 'closed', 'lost')),
  add column if not exists notes text not null default '',
  add column if not exists next_follow_up date,
  add column if not exists updated_at timestamptz not null default now();
grant update (status, notes, next_follow_up, updated_at)
  on public.property_valuation_requests to service_role;
create index if not exists property_valuation_requests_follow_up_idx
  on public.property_valuation_requests (next_follow_up)
  where next_follow_up is not null;
