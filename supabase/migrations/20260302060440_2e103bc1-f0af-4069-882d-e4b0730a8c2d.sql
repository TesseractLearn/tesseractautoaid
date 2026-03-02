
-- booking_id NOT NULL (may already be set, use IF approach)
DO $$
BEGIN
  -- Only alter if currently nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'mechanic_reviews' AND column_name = 'booking_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.mechanic_reviews ALTER COLUMN booking_id SET NOT NULL;
  END IF;
END $$;
