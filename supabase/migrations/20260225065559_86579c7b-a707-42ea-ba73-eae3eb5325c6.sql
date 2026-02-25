
-- Drop the broad SELECT policy that exposes all columns including phone
DROP POLICY IF EXISTS "Authenticated users can view available mechanics" ON public.mechanics;

-- The remaining SELECT policy already restricts to own profile or active booking
-- That's sufficient for base table access (phone visible only when relevant)
