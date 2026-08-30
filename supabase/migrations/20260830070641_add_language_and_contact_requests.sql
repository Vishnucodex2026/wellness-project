/*
# Add language column and create contact_requests table

1. Changes to existing tables
- `wellness_leads`: add `language` text column (defaults to 'en')
2. New Tables
- `contact_requests`
  - `id` (uuid, primary key)
  - `created_at` (timestamptz, defaults to now)
  - `lead_id` (uuid, nullable, references wellness_leads)
  - `full_name` (text, not null)
  - `phone` (text, not null)
  - `email` (text, nullable)
  - `request_type` (text, not null) — 'callback' or 'appointment'
  - `preferred_date` (date, nullable)
  - `preferred_time` (text, nullable)
  - `notes` (text, nullable)
  - `language` (text, defaults to 'en')
3. Security
- Enable RLS on `contact_requests`.
- Allow anon + authenticated INSERT only.
4. Notes
- No-auth public app. Anyone can submit a callback or appointment request.
*/

ALTER TABLE wellness_leads ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES wellness_leads(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  request_type text NOT NULL,
  preferred_date date,
  preferred_time text,
  notes text,
  language text DEFAULT 'en'
);

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact_requests" ON contact_requests;
CREATE POLICY "anon_insert_contact_requests"
ON contact_requests FOR INSERT
TO anon, authenticated WITH CHECK (true);
