-- Drop existing policy and create new one to view all registered mechanics
DROP POLICY IF EXISTS "Anyone can view available mechanics" ON public.mechanics;

CREATE POLICY "Anyone can view registered mechanics"
ON public.mechanics
FOR SELECT
USING (true);