-- Fix bookings table - add all missing columns
-- This migration adds columns needed for the payment and booking system

-- Add missing columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS nurse_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS monthly_rate INTEGER,
ADD COLUMN IF NOT EXISTS guest_message TEXT,
ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payout INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN bookings.nurse_id IS 'ID of the nurse making the booking (same as guest_id)';
COMMENT ON COLUMN bookings.guest_id IS 'ID of the guest making the booking';
COMMENT ON COLUMN bookings.monthly_rate IS 'Price per month in cents at time of booking';
COMMENT ON COLUMN bookings.guest_message IS 'Message from guest to host with booking request';
COMMENT ON COLUMN bookings.hold_expires_at IS 'When the booking hold expires if not accepted';
COMMENT ON COLUMN bookings.cancelled_at IS 'When the booking was cancelled';
COMMENT ON COLUMN bookings.cancelled_by IS 'User who cancelled the booking';
COMMENT ON COLUMN bookings.payout IS 'Amount paid out to host after platform fee (in cents)';

-- Update nurse_id to match guest_id for existing bookings
UPDATE bookings
SET nurse_id = guest_id
WHERE nurse_id IS NULL AND guest_id IS NOT NULL;

-- Populate monthly_rate from listings for existing bookings
UPDATE bookings b
SET monthly_rate = l.price_per_month
FROM listings l
WHERE b.listing_id = l.id
  AND b.monthly_rate IS NULL;

-- Calculate payout for existing bookings (90% of total after 10% platform fee)
UPDATE bookings
SET payout = ROUND(total_price * 0.90)
WHERE payout IS NULL AND total_price IS NOT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_nurse_id ON bookings(nurse_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_end_date ON bookings(end_date);

-- Add RLS policies for nurse_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
    AND policyname = 'Users can view their nurse bookings'
  ) THEN
    CREATE POLICY "Users can view their nurse bookings"
      ON bookings FOR SELECT
      USING (auth.uid() = nurse_id OR auth.uid() = guest_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
    AND policyname = 'Nurses can update their bookings'
  ) THEN
    CREATE POLICY "Nurses can update their bookings"
      ON bookings FOR UPDATE
      USING (auth.uid() = nurse_id OR auth.uid() = guest_id);
  END IF;
END $$;
