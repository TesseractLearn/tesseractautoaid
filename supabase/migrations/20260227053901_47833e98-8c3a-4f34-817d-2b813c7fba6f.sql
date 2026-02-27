
-- Restrict mechanics base table: only mechanic themselves can SELECT their own row
-- Other users should use mechanics_public view instead
DROP POLICY IF EXISTS "Authenticated users can view mechanics" ON public.mechanics;

-- Mechanics can view their own full profile
CREATE POLICY "Mechanics can view own profile"
  ON public.mechanics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users with active bookings can view their assigned mechanic (needed for tracking)
CREATE POLICY "Users can view assigned mechanic"
  ON public.mechanics
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT mechanic_id FROM public.bookings
      WHERE bookings.user_id = auth.uid()
        AND bookings.mechanic_id IS NOT NULL
        AND status IN ('accepted', 'in_progress', 'completed')
    )
  );

-- Service role (edge functions) can still read all mechanics
-- (handled automatically by service_role key bypassing RLS)
