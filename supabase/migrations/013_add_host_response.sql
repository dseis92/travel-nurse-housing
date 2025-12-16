-- Add host response fields to bookings table
-- This allows hosts to provide messages when accepting/declining bookings

-- Add host_response and responded_at columns if they don't exist
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS host_response TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Add comments for clarity
COMMENT ON COLUMN bookings.host_response IS 'Message from host when accepting or declining booking';
COMMENT ON COLUMN bookings.responded_at IS 'Timestamp when host accepted or declined the booking';

-- Create trigger to automatically set responded_at when status changes from pending
CREATE OR REPLACE FUNCTION public.set_booking_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed from pending to accepted or declined, set responded_at
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
    NEW.responded_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS set_booking_responded_at_trigger ON public.bookings;
CREATE TRIGGER set_booking_responded_at_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_responded_at();
