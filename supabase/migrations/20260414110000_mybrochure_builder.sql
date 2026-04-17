create table if not exists public.brochures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  user_id text,
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  template text not null default 'modern',
  style_settings jsonb not null default '{"fontFamily":"helvetica","accentColor":"#c40018","logoUrl":null}'::jsonb,
  content_json jsonb not null default '{"imageOrder":[],"selectedImageIds":[],"sections":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brochures_template_check
    check (template in ('minimal', 'modern', 'luxury')),
  constraint brochures_style_settings_object_check
    check (jsonb_typeof(style_settings) = 'object'),
  constraint brochures_content_json_object_check
    check (jsonb_typeof(content_json) = 'object')
);

create index if not exists brochures_created_at_idx
  on public.brochures(created_at desc);

insert into public.brochures (
  project_id,
  user_id,
  title,
  subtitle,
  body,
  template,
  style_settings,
  content_json,
  created_at,
  updated_at
)
select
  settings.project_id,
  null,
  settings.title,
  settings.subtitle,
  settings.body,
  settings.template,
  jsonb_build_object(
    'fontFamily', settings.font_family,
    'accentColor', settings.accent_color,
    'logoUrl', settings.logo_url
  ),
  jsonb_build_object(
    'imageOrder', coalesce(
      (
        select jsonb_agg('approved:' || value)
        from jsonb_array_elements_text(coalesce(settings.selected_image_ids, '[]'::jsonb)) as value
      ),
      '[]'::jsonb
    ),
    'selectedImageIds', coalesce(
      (
        select jsonb_agg('approved:' || value)
        from jsonb_array_elements_text(coalesce(settings.selected_image_ids, '[]'::jsonb)) as value
      ),
      '[]'::jsonb
    ),
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'hero',
        'imageId', case
          when jsonb_array_length(coalesce(settings.selected_image_ids, '[]'::jsonb)) > 0
            then 'approved:' || (settings.selected_image_ids ->> 0)
          else null
        end
      ),
      jsonb_build_object(
        'type', 'gallery',
        'imageIds', coalesce(
          (
            select jsonb_agg('approved:' || value)
            from jsonb_array_elements_text(coalesce(settings.selected_image_ids, '[]'::jsonb)) as value
          ),
          '[]'::jsonb
        )
      ),
      jsonb_build_object(
        'type', 'text',
        'content', settings.body
      )
    )
  ),
  settings.created_at,
  settings.updated_at
from public.brochure_settings as settings
on conflict (project_id) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  template = excluded.template,
  style_settings = excluded.style_settings,
  content_json = excluded.content_json,
  updated_at = excluded.updated_at;

alter table public.brochure_assets
  drop constraint if exists brochure_assets_kind_check;

alter table public.brochure_assets
  add constraint brochure_assets_kind_check
  check (kind in ('extra', 'logo'));
