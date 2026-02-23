
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage offers" ON public.booking_offers;

-- Create specific policies for insert/update that edge functions need
-- Edge functions use service_role key which bypasses RLS, so we don't need a special policy
-- Instead, add policies for mechanics to update their own offers
CREATE POLICY "Mechanics can update their offers"
ON public.booking_offers
FOR UPDATE
USING (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));
