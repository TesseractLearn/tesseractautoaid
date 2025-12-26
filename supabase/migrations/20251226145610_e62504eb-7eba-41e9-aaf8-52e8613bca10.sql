-- Drop the mechanics_public view if it exists
DROP VIEW IF EXISTS public.mechanics_public;

-- Create a new RLS policy for authenticated users to view available mechanics
CREATE POLICY "Authenticated users can view available mechanics"
ON public.mechanics
FOR SELECT
TO authenticated
USING (is_available = true);