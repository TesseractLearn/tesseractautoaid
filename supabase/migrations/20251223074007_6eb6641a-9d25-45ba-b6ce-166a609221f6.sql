-- Create bookings table to track service requests
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mechanic_id UUID REFERENCES public.mechanics(id),
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  issue_description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  estimated_price NUMERIC,
  final_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- Mechanics can view bookings assigned to them
CREATE POLICY "Mechanics can view assigned bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.mechanics WHERE id = mechanic_id));

-- Mechanics can update bookings assigned to them
CREATE POLICY "Mechanics can update assigned bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.mechanics WHERE id = mechanic_id));

-- Add trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;