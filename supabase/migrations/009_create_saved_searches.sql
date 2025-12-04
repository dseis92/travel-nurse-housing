-- Create saved searches table
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Search name
  name text not null,

  -- Search filters (stored as JSONB for flexibility)
  filters jsonb not null default '{}'::jsonb,

  -- Example filters structure:
  -- {
  --   "city": "Boston",
  --   "state": "MA",
  --   "hospitalName": "Massachusetts General Hospital",
  --   "maxBudget": 2500,
  --   "roomType": "private-room",
  --   "startDate": "2024-06-01",
  --   "endDate": "2024-09-01",
  --   "amenities": ["wifi", "parking"],
  --   "mapBounds": {
  --     "north": 42.4,
  --     "south": 42.3,
  --     "east": -71.0,
  --     "west": -71.1
  --   }
  -- }

  -- Alert settings
  alert_enabled boolean default false,
  alert_frequency text check (alert_frequency in ('instant', 'daily', 'weekly')) default 'daily',
  last_alert_sent_at timestamptz,

  -- Metadata
  result_count integer default 0,
  last_checked_at timestamptz default now()
);

-- Create indexes
create index saved_searches_user_id_idx on public.saved_searches(user_id);
create index saved_searches_alert_enabled_idx on public.saved_searches(alert_enabled) where alert_enabled = true;

-- Enable Row Level Security
alter table public.saved_searches enable row level security;

-- Users can view their own saved searches
create policy "Users can view own saved searches"
  on public.saved_searches
  for select
  using (auth.uid() = user_id);

-- Users can create their own saved searches
create policy "Users can create own saved searches"
  on public.saved_searches
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own saved searches
create policy "Users can update own saved searches"
  on public.saved_searches
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own saved searches
create policy "Users can delete own saved searches"
  on public.saved_searches
  for delete
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create trigger handle_saved_searches_updated_at
  before update on public.saved_searches
  for each row
  execute function public.handle_updated_at();
