DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Mechanics can view related customer profiles'
  ) THEN
    CREATE POLICY "Mechanics can view related customer profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.mechanics m
        WHERE m.user_id = auth.uid()
          AND EXISTS (
            SELECT 1
            FROM public.bookings b
            WHERE b.user_id = profiles.user_id
              AND (
                b.mechanic_id = m.id
                OR EXISTS (
                  SELECT 1
                  FROM public.booking_offers bo
                  WHERE bo.booking_id = b.id
                    AND bo.mechanic_id = m.id
                )
              )
          )
      )
    );
  END IF;
END
$$;