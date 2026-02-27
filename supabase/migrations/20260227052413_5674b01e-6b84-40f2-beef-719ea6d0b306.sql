
-- Fix booking_offers: drop ALL SELECT policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Mechanics can view their offers" ON public.booking_offers;
DROP POLICY IF EXISTS "Users can view offers for their bookings" ON public.booking_offers;

CREATE POLICY "Mechanics can view their offers"
  ON public.booking_offers AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid()));

CREATE POLICY "Users can view offers for their bookings"
  ON public.booking_offers AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

-- Fix bookings: mechanics with pending/accepted offers should see the booking
DROP POLICY IF EXISTS "Mechanics can view bookings with their offers" ON public.bookings;

CREATE POLICY "Mechanics can view bookings with their offers"
  ON public.bookings AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT booking_id FROM booking_offers
      WHERE mechanic_id IN (SELECT id FROM mechanics WHERE user_id = auth.uid())
    )
  );
