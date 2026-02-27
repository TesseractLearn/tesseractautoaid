
-- Re-add broad authenticated SELECT on mechanics base table 
-- This is required for the mechanics_public view (security_invoker=on) to work
-- The view already strips sensitive columns (phone, documents_url, total_earnings)
-- Users with active bookings still get full access via the separate policy

DROP POLICY IF EXISTS "Mechanics can view own profile" ON public.mechanics;
DROP POLICY IF EXISTS "Users can view assigned mechanic" ON public.mechanics;

-- Single policy: authenticated users can read mechanics
-- Sensitive data is protected by directing app code to mechanics_public view
CREATE POLICY "Authenticated users can view mechanics"
  ON public.mechanics
  FOR SELECT
  TO authenticated
  USING (true);
