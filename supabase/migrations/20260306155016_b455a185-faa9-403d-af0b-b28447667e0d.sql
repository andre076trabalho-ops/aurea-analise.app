
CREATE TABLE public.published_reports (
  id TEXT PRIMARY KEY,
  report_title TEXT NOT NULL,
  report_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_name TEXT NOT NULL,
  client_contact TEXT,
  doctor_name TEXT,
  city TEXT,
  sections JSONB NOT NULL,
  branding JSONB,
  overall_score INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.published_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published reports (public landing pages)
CREATE POLICY "Anyone can read published reports"
  ON public.published_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert/update (no auth yet in this app)
CREATE POLICY "Anyone can insert published reports"
  ON public.published_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update published reports"
  ON public.published_reports
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
