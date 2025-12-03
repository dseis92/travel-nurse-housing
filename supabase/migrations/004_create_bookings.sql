-- Create bookings table
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- References
  listing_id uuid references public.listings(id) on delete cascade not null,
  nurse_id uuid references auth.users(id) on delete cascade not null,
  host_id uuid references auth.users(id) on delete cascade not null,

  -- Booking details
  start_date date not null,
  end_date date not null,

  -- Guest information
  guest_name text,
  guest_email text,
  guest_phone text,
  guest_message text,

  -- Pricing
  total_price integer not null,
  platform_fee integer default 0,
  host_payout integer not null,

  -- Status
  status text not null check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed')),

  -- Hold expiration (for pending bookings)
  hold_expires_at timestamptz,

  -- Cancellation details
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id),
  cancellation_reason text,

  -- Metadata
  special_requests text,
  contract_length_weeks integer,

  -- Check dates are valid
  constraint valid_date_range check (end_date > start_date)
);

-- Create indexes for common queries
create index bookings_listing_id_idx on public.bookings(listing_id);
create index bookings_nurse_id_idx on public.bookings(nurse_id);
create index bookings_host_id_idx on public.bookings(host_id);
create index bookings_status_idx on public.bookings(status);
create index bookings_start_date_idx on public.bookings(start_date);
create index bookings_end_date_idx on public.bookings(end_date);
create index bookings_hold_expires_at_idx on public.bookings(hold_expires_at)
  where hold_expires_at is not null;

-- Enable Row Level Security
alter table public.bookings enable row level security;

-- Policies for bookings

-- Nurses can view their own bookings
create policy "Nurses can view own bookings"
  on public.bookings
  for select
  using (auth.uid() = nurse_id);

-- Hosts can view bookings for their listings
create policy "Hosts can view bookings for their listings"
  on public.bookings
  for select
  using (auth.uid() = host_id);

-- Nurses can create bookings
create policy "Nurses can create bookings"
  on public.bookings
  for insert
  with check (auth.uid() = nurse_id);

-- Nurses can update their own pending bookings (to cancel)
create policy "Nurses can update own bookings"
  on public.bookings
  for update
  using (auth.uid() = nurse_id and status in ('pending', 'accepted'))
  with check (auth.uid() = nurse_id);

-- Hosts can update bookings for their listings (accept/decline)
create policy "Hosts can update bookings for their listings"
  on public.bookings
  for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- Trigger to update updated_at on bookings
create trigger handle_bookings_updated_at
  before update on public.bookings
  for each row
  execute function public.handle_updated_at();

-- Function to automatically set host_id from listing
create or replace function public.set_booking_host_id()
returns trigger as $$
begin
  -- Get the host_id from the listing
  select host_id into new.host_id
  from public.listings
  where id = new.listing_id;

  return new;
end;
$$ language plpgsql;

-- Trigger to set host_id on booking creation
create trigger set_booking_host_id_trigger
  before insert on public.bookings
  for each row
  execute function public.set_booking_host_id();

-- Function to check if listing is available for booking dates
create or replace function public.check_booking_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date,
  p_exclude_booking_id uuid default null
)
returns boolean as $$
declare
  v_has_conflict boolean;
begin
  -- Check if there are any accepted bookings that overlap with the requested dates
  select exists(
    select 1
    from public.bookings
    where listing_id = p_listing_id
      and status = 'accepted'
      and (id != p_exclude_booking_id or p_exclude_booking_id is null)
      and (
        -- New booking starts during existing booking
        (p_start_date >= start_date and p_start_date < end_date)
        or
        -- New booking ends during existing booking
        (p_end_date > start_date and p_end_date <= end_date)
        or
        -- New booking completely encompasses existing booking
        (p_start_date <= start_date and p_end_date >= end_date)
      )
  ) into v_has_conflict;

  return not v_has_conflict;
end;
$$ language plpgsql;

-- Function to automatically expire pending bookings
create or replace function public.expire_pending_bookings()
returns void as $$
begin
  update public.bookings
  set
    status = 'declined',
    updated_at = now()
  where status = 'pending'
    and hold_expires_at is not null
    and hold_expires_at < now();
end;
$$ language plpgsql;

-- Create a scheduled job to expire bookings (requires pg_cron extension)
-- Note: This needs to be set up manually in Supabase dashboard or with pg_cron extension
-- For now, we'll rely on client-side checks

-- View for booking details with listing and user information
create or replace view public.booking_details as
select
  b.id,
  b.created_at,
  b.updated_at,
  b.listing_id,
  b.nurse_id,
  b.host_id,
  b.start_date,
  b.end_date,
  b.guest_name,
  b.guest_email,
  b.guest_phone,
  b.guest_message,
  b.total_price,
  b.platform_fee,
  b.host_payout,
  b.status,
  b.hold_expires_at,
  b.cancelled_at,
  b.cancelled_by,
  b.cancellation_reason,
  b.special_requests,
  b.contract_length_weeks,
  -- Listing details
  l.title as listing_title,
  l.city as listing_city,
  l.state as listing_state,
  l.image_url as listing_image_url,
  l.price_per_month as listing_price_per_month,
  -- Nurse profile (basic info only)
  np.name as nurse_name,
  np.email as nurse_email,
  -- Host profile (basic info only)
  hp.name as host_name,
  hp.email as host_email
from public.bookings b
left join public.listings l on l.id = b.listing_id
left join public.profiles np on np.id = b.nurse_id
left join public.profiles hp on hp.id = b.host_id;

-- Grant access to the view
grant select on public.booking_details to authenticated;
