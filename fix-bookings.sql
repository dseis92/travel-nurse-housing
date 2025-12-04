-- Fix bookings table - add all missing columns
-- Run this in Supabase SQL Editor

-- Add missing columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS nurse_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS monthly_rate INTEGER,
ADD COLUMN IF NOT EXISTS guest_message TEXT,
ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payout INTEGER;

-- Update nurse_id to match guest_id for existing bookings
UPDATE bookings
SET nurse_id = guest_id
WHERE nurse_id IS NULL AND guest_id IS NOT NULL;

-- Populate monthly_rate from listings
UPDATE bookings b
SET monthly_rate = l.price_per_month
FROM listings l
WHERE b.listing_id = l.id
  AND b.monthly_rate IS NULL;

-- Calculate payout (90% of total after platform fee)
UPDATE bookings
SET payout = ROUND(total_price * 0.90)
WHERE payout IS NULL AND total_price IS NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bookings_nurse_id ON bookings(nurse_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

