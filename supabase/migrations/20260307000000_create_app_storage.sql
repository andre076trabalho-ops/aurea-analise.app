
CREATE TABLE IF NOT EXISTS public.app_storage (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON public.app_storage
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
