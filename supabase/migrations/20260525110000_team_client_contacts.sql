do $$
begin
  if to_regclass('public.team_clients') is null then
    raise notice 'Skipping team_client_contacts creation because team_clients is missing.';
    return;
  end if;

  execute $sql$
    create table if not exists public.team_client_contacts (
      id uuid primary key default gen_random_uuid(),
      client_id uuid not null references public.team_clients(id) on delete cascade,
      name text not null default '',
      last_contact date,
      note text not null default '',
      next_contact date,
      created_at timestamptz not null default timezone('utc', now())
    )
  $sql$;

  execute $sql$
    create index if not exists team_client_contacts_client_id_created_at_idx
    on public.team_client_contacts (client_id, created_at)
  $sql$;
end
$$;
