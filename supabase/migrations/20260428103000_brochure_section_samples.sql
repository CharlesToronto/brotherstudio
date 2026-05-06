create table if not exists public.brochure_section_samples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brochure_section_samples_name_check check (length(trim(name)) > 0),
  constraint brochure_section_samples_section_json_object_check
    check (jsonb_typeof(section_json) = 'object')
);

create index if not exists brochure_section_samples_updated_at_idx
  on public.brochure_section_samples(updated_at desc);
