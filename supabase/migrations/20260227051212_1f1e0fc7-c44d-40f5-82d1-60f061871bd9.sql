-- Drop the restrictive SELECT policies on booking_offers
DROP POLICY IF EXISTS "Mechanics can view their offers" ON public.booking_offers;
DROP POLICY IF EXISTS "Users can view offers for their bookings" ON public.booking_offers;

-- Recreate as PERMISSIVE so EITHER condition grants access
CREATE POLICY "Mechanics can view their offers"
  ON public.booking_offers
  FOR SELECT
  TO authenticated
  USING (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));

CREATE POLICY "Users can view offers for their bookings"
  ON public.booking_offers
  FOR SELECT
  TO authenticated
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));