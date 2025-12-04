-- Apply only the NEW migrations that don't exist yet
-- Run this in Supabase SQL Editor

-- ============================================
-- UTILITY FUNCTIONS (if not exists)
-- ============================================

-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION 005: Messages System (message_threads + messages)
-- ============================================

-- Create message_threads table
-- Note: listing_id type will match your existing listings table (bigint or uuid)
DO $$
DECLARE
  listing_id_type text;
BEGIN
  -- Detect the data type of listings.id
  SELECT data_type INTO listing_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'id';

  -- Create table with appropriate listing_id type
  IF listing_id_type = 'bigint' THEN
    CREATE TABLE IF NOT EXISTS public.message_threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      listing_id bigint REFERENCES public.listings(id) ON DELETE SET NULL,
      participant_ids uuid[] NOT NULL,
      archived_by uuid[] DEFAULT array[]::uuid[],
      CONSTRAINT valid_participants CHECK (array_length(participant_ids, 1) >= 2)
    );
  ELSE
    CREATE TABLE IF NOT EXISTS public.message_threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
      participant_ids uuid[] NOT NULL,
      archived_by uuid[] DEFAULT array[]::uuid[],
      CONSTRAINT valid_participants CHECK (array_length(participant_ids, 1) >= 2)
    );
  END IF;
END $$;

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- References
  thread_id uuid REFERENCES public.message_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Message content
  body text NOT NULL,

  -- Optional attachments (array of storage URLs)
  attachments text[],

  -- System messages (like booking notifications)
  is_system boolean DEFAULT false,

  -- Read receipts
  read_by uuid[] DEFAULT array[]::uuid[],

  -- Soft delete
  deleted_at timestamptz,

  -- Check body is not empty
  CONSTRAINT valid_body CHECK (length(trim(body)) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS message_threads_participant_ids_idx ON public.message_threads USING gin(participant_ids);
CREATE INDEX IF NOT EXISTS message_threads_listing_id_idx ON public.message_threads(listing_id);
CREATE INDEX IF NOT EXISTS message_threads_updated_at_idx ON public.message_threads(updated_at DESC);

CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS messages_read_by_idx ON public.messages USING gin(read_by);

-- Enable RLS
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for message_threads
DROP POLICY IF EXISTS "Users can view their message threads" ON public.message_threads;
CREATE POLICY "Users can view their message threads"
  ON public.message_threads FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Users can create message threads" ON public.message_threads;
CREATE POLICY "Users can create message threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Users can update their message threads" ON public.message_threads;
CREATE POLICY "Users can update their message threads"
  ON public.message_threads FOR UPDATE
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.messages;
CREATE POLICY "Users can view messages in their threads"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads
      WHERE id = messages.thread_id
      AND auth.uid() = ANY(participant_ids)
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can send messages in their threads" ON public.messages;
CREATE POLICY "Users can send messages in their threads"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.message_threads
      WHERE id = messages.thread_id
      AND auth.uid() = ANY(participant_ids)
    )
    AND auth.uid() = sender_id
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id OR EXISTS (
    SELECT 1 FROM public.message_threads
    WHERE id = messages.thread_id
    AND auth.uid() = ANY(participant_ids)
  ))
  WITH CHECK (auth.uid() = sender_id OR EXISTS (
    SELECT 1 FROM public.message_threads
    WHERE id = messages.thread_id
    AND auth.uid() = ANY(participant_ids)
  ));

-- Triggers
DROP TRIGGER IF EXISTS handle_message_threads_updated_at ON public.message_threads;
CREATE TRIGGER handle_message_threads_updated_at
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_messages_updated_at ON public.messages;
CREATE TRIGGER handle_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Functions for messages
CREATE OR REPLACE FUNCTION public.mark_message_as_read(
  p_message_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE id = p_message_id
    AND NOT (p_user_id = ANY(read_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_thread_messages_as_read(
  p_thread_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE thread_id = p_thread_id
    AND sender_id != p_user_id
    AND NOT (p_user_id = ANY(read_by))
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MIGRATION 009: Saved Searches
-- ============================================

-- Create saved searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Search criteria
  name text NOT NULL,
  city text,
  state text,
  hospital_name text,
  max_budget integer,
  room_type text,
  start_date date,
  end_date date,

  -- Alert settings
  alerts_enabled boolean DEFAULT true,
  alert_frequency text CHECK (alert_frequency IN ('instant', 'daily', 'weekly')) DEFAULT 'daily',
  last_alert_sent_at timestamptz,

  -- Metadata
  search_count integer DEFAULT 0,
  last_searched_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS saved_searches_user_id_idx ON public.saved_searches(user_id);

-- Enable RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own saved searches" ON public.saved_searches;
CREATE POLICY "Users can view own saved searches"
  ON public.saved_searches FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own saved searches" ON public.saved_searches;
CREATE POLICY "Users can create own saved searches"
  ON public.saved_searches FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own saved searches" ON public.saved_searches;
CREATE POLICY "Users can update own saved searches"
  ON public.saved_searches FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own saved searches" ON public.saved_searches;
CREATE POLICY "Users can delete own saved searches"
  ON public.saved_searches FOR DELETE
  USING (user_id = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_saved_searches_updated_at ON public.saved_searches;
CREATE TRIGGER handle_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- MIGRATION 010: Availability Calendar
-- ============================================

-- Create availability calendar table
-- Note: listing_id and booking_id types will match your existing tables
DO $$
DECLARE
  listing_id_type text;
  booking_id_type text;
BEGIN
  -- Detect the data types
  SELECT data_type INTO listing_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'listings'
    AND column_name = 'id';

  SELECT data_type INTO booking_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'bookings'
    AND column_name = 'id';

  -- Create table with appropriate types
  IF listing_id_type = 'bigint' AND booking_id_type = 'bigint' THEN
    CREATE TABLE IF NOT EXISTS public.listing_availability (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id bigint REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      start_date date NOT NULL,
      end_date date NOT NULL,
      status text NOT NULL CHECK (status IN ('available', 'blocked', 'booked')) DEFAULT 'available',
      notes text,
      booking_id bigint REFERENCES public.bookings(id) ON DELETE SET NULL,
      CONSTRAINT valid_date_range CHECK (end_date >= start_date)
    );
  ELSIF listing_id_type = 'bigint' AND booking_id_type = 'uuid' THEN
    CREATE TABLE IF NOT EXISTS public.listing_availability (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id bigint REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      start_date date NOT NULL,
      end_date date NOT NULL,
      status text NOT NULL CHECK (status IN ('available', 'blocked', 'booked')) DEFAULT 'available',
      notes text,
      booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
      CONSTRAINT valid_date_range CHECK (end_date >= start_date)
    );
  ELSE
    CREATE TABLE IF NOT EXISTS public.listing_availability (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      start_date date NOT NULL,
      end_date date NOT NULL,
      status text NOT NULL CHECK (status IN ('available', 'blocked', 'booked')) DEFAULT 'available',
      notes text,
      booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
      CONSTRAINT valid_date_range CHECK (end_date >= start_date)
    );
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS listing_availability_listing_id_idx ON public.listing_availability(listing_id);
CREATE INDEX IF NOT EXISTS listing_availability_dates_idx ON public.listing_availability(start_date, end_date);
CREATE INDEX IF NOT EXISTS listing_availability_status_idx ON public.listing_availability(status);

-- Enable RLS
ALTER TABLE public.listing_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view listing availability" ON public.listing_availability;
CREATE POLICY "Anyone can view listing availability"
  ON public.listing_availability FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Hosts can add availability for own listings" ON public.listing_availability;
CREATE POLICY "Hosts can add availability for own listings"
  ON public.listing_availability FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_availability.listing_id
      AND listings.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts can update availability for own listings" ON public.listing_availability;
CREATE POLICY "Hosts can update availability for own listings"
  ON public.listing_availability FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_availability.listing_id
      AND listings.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts can delete availability for own listings" ON public.listing_availability;
CREATE POLICY "Hosts can delete availability for own listings"
  ON public.listing_availability FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = listing_availability.listing_id
      AND listings.host_id = auth.uid()
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_listing_availability_updated_at ON public.listing_availability;
CREATE TRIGGER handle_listing_availability_updated_at
  BEFORE UPDATE ON public.listing_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- FUNCTIONS for Availability Calendar
-- ============================================

-- Function to check listing availability
CREATE OR REPLACE FUNCTION public.check_listing_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS boolean AS $$
DECLARE
  v_conflicts integer;
BEGIN
  SELECT count(*)
  INTO v_conflicts
  FROM public.listing_availability
  WHERE listing_id = p_listing_id
  AND status IN ('blocked', 'booked')
  AND (start_date <= p_end_date AND end_date >= p_start_date);

  RETURN v_conflicts = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create availability when booking confirmed
CREATE OR REPLACE FUNCTION public.create_booking_availability()
RETURNS trigger AS $$
BEGIN
  -- Create availability entry when booking is accepted
  IF new.status = 'accepted' AND (old.status IS NULL OR old.status != 'accepted') THEN
    INSERT INTO public.listing_availability (
      listing_id,
      start_date,
      end_date,
      status,
      booking_id
    ) VALUES (
      new.listing_id,
      new.start_date::date,
      new.end_date::date,
      'booked',
      new.id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Remove availability entry if booking cancelled/declined
  IF new.status IN ('cancelled', 'declined') AND old.status = 'accepted' THEN
    DELETE FROM public.listing_availability
    WHERE booking_id = new.id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-manage availability when bookings change
DROP TRIGGER IF EXISTS handle_booking_availability ON public.bookings;
CREATE TRIGGER handle_booking_availability
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_availability();

-- Function to get available dates for a listing in a month
CREATE OR REPLACE FUNCTION public.get_listing_available_dates(
  p_listing_id uuid,
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  date_value date,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d::date AS date_value,
    COALESCE(
      (
        SELECT la.status
        FROM public.listing_availability la
        WHERE la.listing_id = p_listing_id
        AND d::date BETWEEN la.start_date AND la.end_date
        ORDER BY
          CASE la.status
            WHEN 'booked' THEN 1
            WHEN 'blocked' THEN 2
            ELSE 3
          END
        LIMIT 1
      ),
      'available'
    ) AS status
  FROM generate_series(
    make_date(p_year, p_month, 1),
    (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::date,
    INTERVAL '1 day'
  ) d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE!
-- ============================================

SELECT 'All new migrations applied successfully!' AS result;
