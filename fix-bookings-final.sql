-- FINAL complete fix for bookings table
-- Run this in Supabase SQL Editor

-- Add ALL missing columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS nurse_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS total_price INTEGER,
ADD COLUMN IF NOT EXISTS total_months INTEGER,
ADD COLUMN IF NOT EXISTS monthly_rate INTEGER,
ADD COLUMN IF NOT EXISTS guest_message TEXT,
ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payout INTEGER,
ADD COLUMN IF NOT EXISTS platform_fee INTEGER;

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

-- Calculate total_months from start_date and end_date
UPDATE bookings
SET total_months = GREATEST(1, CEIL(EXTRACT(EPOCH FROM (end_date - start_date)) / (30.0 * 24 * 60 * 60)))
WHERE total_months IS NULL AND start_date IS NOT NULL AND end_date IS NOT NULL;

-- Calculate total_price from monthly_rate * total_months
UPDATE bookings
SET total_price = monthly_rate * COALESCE(total_months, 1)
WHERE total_price IS NULL AND monthly_rate IS NOT NULL;

-- Calculate platform fee (10% of total)
UPDATE bookings
SET platform_fee = ROUND(total_price * 0.10)
WHERE platform_fee IS NULL AND total_price IS NOT NULL;

-- Calculate payout (90% of total after platform fee)
UPDATE bookings
SET payout = total_price - COALESCE(platform_fee, ROUND(total_price * 0.10))
WHERE payout IS NULL AND total_price IS NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_nurse_id ON bookings(nurse_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Add comments for documentation
COMMENT ON COLUMN bookings.total_months IS 'Number of months for the booking period';
COMMENT ON COLUMN bookings.total_price IS 'Total price in cents (monthly_rate * total_months)';
COMMENT ON COLUMN bookings.monthly_rate IS 'Monthly rate in cents at time of booking';
COMMENT ON COLUMN bookings.platform_fee IS 'Platform fee in cents (10% of total_price)';
COMMENT ON COLUMN bookings.payout IS 'Host payout in cents (total_price - platform_fee)';

