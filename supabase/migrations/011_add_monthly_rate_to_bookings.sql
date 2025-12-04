-- Add monthly_rate column to bookings table
-- This stores the price per month at the time of booking

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS monthly_rate INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN bookings.monthly_rate IS 'Price per month in cents at time of booking';

-- Optionally populate existing bookings from their listings
UPDATE bookings b
SET monthly_rate = l.price_per_month
FROM listings l
WHERE b.listing_id = l.id
  AND b.monthly_rate IS NULL;
