-- Fix bookings table - add missing host_id column
-- Run this in Supabase SQL Editor

-- First, check what type the bookings.id column is
DO $$
DECLARE
  bookings_id_type text;
  users_id_type text;
BEGIN
  -- Get bookings.id type
  SELECT data_type INTO bookings_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'bookings'
    AND column_name = 'id';

  -- Get auth.users.id type (should always be uuid)
  users_id_type := 'uuid';

  -- Add host_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'host_id'
  ) THEN
    -- Add the column
    ALTER TABLE public.bookings
    ADD COLUMN host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

    RAISE NOTICE 'Added host_id column to bookings table';

    -- Check if there are any bookings
    IF EXISTS (SELECT 1 FROM public.bookings LIMIT 1) THEN
      RAISE NOTICE 'Found existing bookings, attempting to populate host_id...';

      -- Populate host_id from listings for existing bookings
      UPDATE public.bookings b
      SET host_id = l.host_id
      FROM public.listings l
      WHERE b.listing_id = l.id
        AND b.host_id IS NULL;

      RAISE NOTICE 'Populated host_id for existing bookings';

      -- Check if there are any NULL host_ids remaining
      IF EXISTS (SELECT 1 FROM public.bookings WHERE host_id IS NULL LIMIT 1) THEN
        RAISE NOTICE 'WARNING: Some bookings still have NULL host_id. Deleting orphaned bookings...';

        -- Delete bookings that couldn't be linked to a host
        DELETE FROM public.bookings WHERE host_id IS NULL;

        RAISE NOTICE 'Deleted orphaned bookings';
      END IF;

      -- Make it NOT NULL after cleanup
      ALTER TABLE public.bookings
      ALTER COLUMN host_id SET NOT NULL;

      RAISE NOTICE 'Set host_id to NOT NULL';
    ELSE
      RAISE NOTICE 'No existing bookings found';

      -- Make it NOT NULL immediately if table is empty
      ALTER TABLE public.bookings
      ALTER COLUMN host_id SET NOT NULL;

      RAISE NOTICE 'Set host_id to NOT NULL';
    END IF;
  ELSE
    RAISE NOTICE 'host_id column already exists';
  END IF;

  -- Create index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND indexname = 'bookings_host_id_idx'
  ) THEN
    CREATE INDEX bookings_host_id_idx ON public.bookings(host_id);
    RAISE NOTICE 'Created index on host_id';
  END IF;

  -- Add RLS policy for hosts if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Hosts can view bookings for their listings'
  ) THEN
    CREATE POLICY "Hosts can view bookings for their listings"
      ON public.bookings FOR SELECT
      USING (auth.uid() = host_id);
    RAISE NOTICE 'Created RLS policy for hosts to view bookings';
  END IF;

  -- Add RLS policy for hosts to update bookings if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Hosts can update bookings for their listings'
  ) THEN
    CREATE POLICY "Hosts can update bookings for their listings"
      ON public.bookings FOR UPDATE
      USING (auth.uid() = host_id)
      WITH CHECK (auth.uid() = host_id);
    RAISE NOTICE 'Created RLS policy for hosts to update bookings';
  END IF;
END $$;

-- Create trigger to auto-populate host_id from listing
CREATE OR REPLACE FUNCTION public.set_booking_host_id()
RETURNS trigger AS $$
BEGIN
  -- Get the host_id from the listing
  SELECT host_id INTO NEW.host_id
  FROM public.listings
  WHERE id = NEW.listing_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_booking_host_id_trigger ON public.bookings;
CREATE TRIGGER set_booking_host_id_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_host_id();

SELECT 'Bookings table fixed successfully!' AS result;
