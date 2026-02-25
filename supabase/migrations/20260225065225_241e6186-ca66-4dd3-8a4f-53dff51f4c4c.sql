
-- Harden get_user_role to only allow querying your own role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = _user_id AND _user_id = auth.uid() LIMIT 1;
$$;

-- Add explicit user_id validation to ensure_single_default_vehicle trigger
CREATE OR REPLACE FUNCTION public.ensure_single_default_vehicle()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Only update vehicles belonging to the same user
  IF NEW.is_default = true THEN
    UPDATE public.vehicles SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Add explicit user_id validation to ensure_single_default_payment trigger
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Only update payment methods belonging to the same user
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;
