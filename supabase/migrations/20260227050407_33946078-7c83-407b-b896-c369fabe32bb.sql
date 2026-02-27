-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view mechanics with active booking" ON public.mechanics;

-- Add a new policy allowing all authenticated users to SELECT from mechanics
-- This is needed so the mechanics_public view returns data for mechanic discovery
CREATE POLICY "Authenticated users can view mechanics"
  ON public.mechanics
  FOR SELECT
  TO authenticated
  USING (true);