-- Create listings table
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Host information
  host_id uuid references auth.users(id) on delete cascade not null,

  -- Basic information
  title text not null,
  description text,

  -- Location
  city text not null,
  state text not null,
  address text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),

  -- Hospital proximity
  hospital_name text not null,
  hospital_city text not null,
  hospital_state text not null,
  minutes_to_hospital integer not null,

  -- Pricing
  price_per_month integer not null,

  -- Property details
  room_type text not null check (room_type in ('private-room', 'entire-place', 'shared')),
  bedrooms integer,
  bathrooms numeric(3, 1),
  max_guests integer default 1,

  -- Amenities and features
  tags text[] default '{}',
  perks text[] default '{}',
  safety_features text[] default '{}',

  -- Host attributes
  verified_host boolean default false,
  allows_pets boolean default false,
  parking text check (parking in ('street', 'garage', 'driveway', 'none')),

  -- Availability
  available_from date,
  available_to date,
  ideal_contract_lengths integer[] default '{}',

  -- Images
  image_url text,
  image_urls text[] default '{}',

  -- Rating and reviews
  rating numeric(3, 2),
  review_count integer default 0,

  -- Status
  is_active boolean default true,
  is_published boolean default false,

  -- Section for grouping (e.g., "Stays for you", "Near Mayo Clinic")
  section text default 'Available stays'
);

-- Create index for common queries
create index listings_host_id_idx on public.listings(host_id);
create index listings_city_idx on public.listings(city);
create index listings_state_idx on public.listings(state);
create index listings_hospital_name_idx on public.listings(hospital_name);
create index listings_is_active_idx on public.listings(is_active);
create index listings_is_published_idx on public.listings(is_published);
create index listings_price_idx on public.listings(price_per_month);
create index listings_location_idx on public.listings using gist(
  point(latitude, longitude)
) where latitude is not null and longitude is not null;

-- Enable Row Level Security
alter table public.listings enable row level security;

-- Policies for listings

-- Anyone can view published, active listings
create policy "Anyone can view published listings"
  on public.listings
  for select
  using (is_published = true and is_active = true);

-- Hosts can view their own listings (including unpublished)
create policy "Hosts can view own listings"
  on public.listings
  for select
  using (auth.uid() = host_id);

-- Hosts can insert their own listings
create policy "Hosts can insert own listings"
  on public.listings
  for insert
  with check (auth.uid() = host_id);

-- Hosts can update their own listings
create policy "Hosts can update own listings"
  on public.listings
  for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- Hosts can delete their own listings
create policy "Hosts can delete own listings"
  on public.listings
  for delete
  using (auth.uid() = host_id);

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on listings
create trigger handle_listings_updated_at
  before update on public.listings
  for each row
  execute function public.handle_updated_at();

-- Create storage bucket for listing images
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Storage policies for listing images

-- Anyone can view listing images
create policy "Anyone can view listing images"
  on storage.objects
  for select
  using (bucket_id = 'listing-images');

-- Authenticated users can upload listing images
create policy "Authenticated users can upload listing images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'listing-images'
    and auth.role() = 'authenticated'
  );

-- Users can update their own listing images
create policy "Users can update own listing images"
  on storage.objects
  for update
  using (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own listing images
create policy "Users can delete own listing images"
  on storage.objects
  for delete
  using (
    bucket_id = 'listing-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
