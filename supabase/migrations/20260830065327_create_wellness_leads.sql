/*
# Create wellness_leads table (single-tenant, no auth)

1. New Tables
- `wellness_leads`
  - `id` (uuid, primary key)
  - `created_at` (timestamptz, defaults to now)
  - `full_name` (text, not null)
  - `phone` (text, not null)
  - `email` (text, nullable)
  - `city` (text, nullable)
  - `age` (text, not null)
  - `weight` (text, nullable)
  - `height` (text, nullable)
  - `gender` (text, nullable)
  - `answers` (jsonb, not null) — full assessment answers
  - `overall_score` (integer, not null)
  - `category_scores` (jsonb, not null) — per-category scores
  - `readiness` (integer, not null)
  - `main_goal` (text, nullable)
2. Security
- Enable RLS on `wellness_leads`.
- Allow anon + authenticated INSERT only (public can submit a lead).
- No SELECT/UPDATE/DELETE for anon or authenticated — leads are private.
3. Notes
- No-auth public wellness assessment. Anyone with the link can submit. Lead data is write-only from the client; reading leads is done via the Supabase dashboard or service-role context.
*/

CREATE TABLE IF NOT EXISTS wellness_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  age text NOT NULL,
  weight text,
  height text,
  gender text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score integer NOT NULL DEFAULT 0,
  category_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  readiness integer NOT NULL DEFAULT 0,
  main_goal text
);

ALTER TABLE wellness_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_wellness_leads" ON wellness_leads;
CREATE POLICY "anon_insert_wellness_leads"
ON wellness_leads FOR INSERT
TO anon, authenticated WITH CHECK (true);
