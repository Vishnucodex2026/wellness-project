/*
  Admin dashboard + business settings.

  After creating an admin user in Supabase Authentication, insert that user's
  UUID into admin_users. Example:
    INSERT INTO admin_users (user_id, email) VALUES ('AUTH-USER-UUID', 'you@example.com');

  Only users listed in admin_users can read/update lead and appointment data.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "admins_read_admin_users" ON admin_users;
CREATE POLICY "admins_read_admin_users"
ON admin_users FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_read_wellness_leads" ON wellness_leads;
CREATE POLICY "admins_read_wellness_leads"
ON wellness_leads FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_wellness_leads" ON wellness_leads;
CREATE POLICY "admins_update_wellness_leads"
ON wellness_leads FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_read_contact_requests" ON contact_requests;
CREATE POLICY "admins_read_contact_requests"
ON contact_requests FOR SELECT TO authenticated
USING (public.is_admin());

ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

DROP POLICY IF EXISTS "admins_update_contact_requests" ON contact_requests;
CREATE POLICY "admins_update_contact_requests"
ON contact_requests FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS business_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name text NOT NULL DEFAULT 'Be Honest With Yourself',
  owner_name text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',
  business_email text NOT NULL DEFAULT '',
  whatsapp_message text NOT NULL DEFAULT 'Hi, I completed the Be Honest With Yourself wellness assessment and would like to discuss my results.',
  updated_at timestamptz DEFAULT now()
);

INSERT INTO business_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_business_settings" ON business_settings;
CREATE POLICY "admins_read_business_settings"
ON business_settings FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_business_settings" ON business_settings;
CREATE POLICY "admins_update_business_settings"
ON business_settings FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());


-- Public visitors need only the business contact settings (not lead data).
DROP POLICY IF EXISTS "public_read_business_settings" ON business_settings;
CREATE POLICY "public_read_business_settings"
ON business_settings FOR SELECT TO anon, authenticated
USING (id = 1);
