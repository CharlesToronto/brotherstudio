DO $$
BEGIN
  IF to_regclass('public.dashboard_projects') IS NULL THEN
    RAISE EXCEPTION 'La table dashboard_projects est introuvable.';
  END IF;

  ALTER TABLE public.dashboard_projects
    ADD COLUMN IF NOT EXISTS deliverables jsonb NOT NULL DEFAULT '[]'::jsonb;
END
$$;
