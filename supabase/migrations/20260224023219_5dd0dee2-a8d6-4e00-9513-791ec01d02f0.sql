
-- Fix: Both SELECT policies on mechanics are RESTRICTIVE (all must pass).
-- Since there are zero PERMISSIVE policies, nobody can see anything.
-- Solution: Recreate them as PERMISSIVE so either condition grants access.

DROP POLICY IF EXISTS "Authenticated users can view available mechanics" ON public.mechanics;
DROP POLICY IF EXISTS "Users can view mechanics with active booking" ON public.mechanics;

-- Any authenticated user can see available mechanics (PERMISSIVE)
CREATE POLICY "Authenticated users can view available mechanics"
ON public.mechanics FOR SELECT
USING (is_available = true);

-- Mechanic can always see own profile + users with active booking can see their mechanic (PERMISSIVE)
CREATE POLICY "Users can view mechanics with active booking"
ON public.mechanics FOR SELECT
USING ((auth.uid() = user_id) OR has_active_booking_with_mechanic(auth.uid(), id));
