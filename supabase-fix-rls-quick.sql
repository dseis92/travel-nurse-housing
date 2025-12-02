-- ============================================================================
-- Quick RLS Fix - Force Drop and Recreate All Policies
-- ============================================================================

-- Disable RLS temporarily to clean up
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (this forces cleanup)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create fresh policies with correct syntax (NO SELECT wrapper around auth.uid())
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable"
  ON public.profiles FOR SELECT
  USING (true);

-- ============================================================================
-- Test the fix
-- ============================================================================
-- This should work now (run after the above completes)
-- SELECT * FROM public.profiles WHERE id = auth.uid();
