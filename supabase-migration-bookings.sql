-- ============================================================================
-- NightShift Housing - Phase 2: Booking System
-- ============================================================================

-- ============================================================================
-- TABLE: bookings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id INTEGER NOT NULL,
  nurse_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Booking details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_months DECIMAL(3,1) NOT NULL,
  monthly_rate INTEGER NOT NULL,
  total_price INTEGER NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),

  -- Messages/notes
  nurse_message TEXT,
  host_response TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- Booking expiry (48 hour hold after acceptance)
  hold_expires_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_total_months CHECK (total_months > 0),
  CONSTRAINT valid_prices CHECK (monthly_rate > 0 AND total_price > 0)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Nurses can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Hosts can view bookings for their listings" ON public.bookings;
DROP POLICY IF EXISTS "Nurses can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Nurses can cancel their own pending bookings" ON public.bookings;
DROP POLICY IF EXISTS "Hosts can update bookings for their listings" ON public.bookings;

-- Nurses can view their own bookings
CREATE POLICY "Nurses can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = nurse_id);

-- Hosts can view bookings for their listings
CREATE POLICY "Hosts can view bookings for their listings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = host_id);

-- Nurses can create bookings
CREATE POLICY "Nurses can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = nurse_id);

-- Nurses can cancel their own pending bookings
CREATE POLICY "Nurses can cancel their own pending bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = nurse_id AND status = 'pending')
  WITH CHECK (auth.uid() = nurse_id AND status IN ('pending', 'cancelled'));

-- Hosts can update bookings (accept/decline)
CREATE POLICY "Hosts can update bookings for their listings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_nurse_id ON public.bookings(nurse_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host_id ON public.bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON public.bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Set responded_at when status changes from pending
CREATE OR REPLACE FUNCTION public.set_booking_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status != 'pending' AND NEW.responded_at IS NULL THEN
    NEW.responded_at = NOW();
  END IF;

  -- Set hold expiry when booking is accepted (48 hours)
  IF NEW.status = 'accepted' AND NEW.hold_expires_at IS NULL THEN
    NEW.hold_expires_at = NOW() + INTERVAL '48 hours';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_status_change ON public.bookings;
CREATE TRIGGER booking_status_change
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_responded_at();

-- ============================================================================
-- COMPLETE! Run this file in Supabase SQL Editor
-- ============================================================================
