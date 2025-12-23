-- Create mechanics table with location data
CREATE TABLE public.mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;

-- Anyone can view available mechanics (for searching)
CREATE POLICY "Anyone can view available mechanics"
ON public.mechanics
FOR SELECT
USING (is_available = true);

-- Mechanics can update their own profile
CREATE POLICY "Mechanics can update their own profile"
ON public.mechanics
FOR UPDATE
USING (auth.uid() = user_id);

-- Mechanics can insert their own profile
CREATE POLICY "Mechanics can insert their own profile"
ON public.mechanics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for location-based queries
CREATE INDEX idx_mechanics_location ON public.mechanics (latitude, longitude);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_mechanics_updated_at
  BEFORE UPDATE ON public.mechanics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();