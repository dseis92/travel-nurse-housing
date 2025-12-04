-- Create availability calendar table for hosts to block dates
create table public.listing_availability (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Date range for availability or blocking
  start_date date not null,
  end_date date not null,

  -- Availability status
  status text not null check (status in ('available', 'blocked', 'booked')) default 'available',

  -- Optional notes for blocked dates
  notes text,

  -- Link to booking if status is 'booked'
  booking_id uuid references public.bookings(id) on delete set null,

  -- Constraints
  constraint valid_date_range check (end_date >= start_date)
);

-- Create indexes
create index listing_availability_listing_id_idx on public.listing_availability(listing_id);
create index listing_availability_dates_idx on public.listing_availability(start_date, end_date);
create index listing_availability_status_idx on public.listing_availability(status);

-- Enable Row Level Security
alter table public.listing_availability enable row level security;

-- Anyone can view availability (for checking booking conflicts)
create policy "Anyone can view listing availability"
  on public.listing_availability
  for select
  using (true);

-- Hosts can insert availability for their own listings
create policy "Hosts can add availability for own listings"
  on public.listing_availability
  for insert
  with check (
    exists (
      select 1 from public.listings
      where listings.id = listing_availability.listing_id
      and listings.host_id = auth.uid()
    )
  );

-- Hosts can update availability for their own listings
create policy "Hosts can update availability for own listings"
  on public.listing_availability
  for update
  using (
    exists (
      select 1 from public.listings
      where listings.id = listing_availability.listing_id
      and listings.host_id = auth.uid()
    )
  );

-- Hosts can delete availability for their own listings
create policy "Hosts can delete availability for own listings"
  on public.listing_availability
  for delete
  using (
    exists (
      select 1 from public.listings
      where listings.id = listing_availability.listing_id
      and listings.host_id = auth.uid()
    )
  );

-- Trigger to update updated_at
create trigger handle_listing_availability_updated_at
  before update on public.listing_availability
  for each row
  execute function public.handle_updated_at();

-- Function to check if a listing is available for given dates
create or replace function public.check_listing_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
)
returns boolean as $$
declare
  v_conflicts integer;
begin
  -- Check for any blocked or booked dates that overlap with the requested range
  select count(*)
  into v_conflicts
  from public.listing_availability
  where listing_id = p_listing_id
  and status in ('blocked', 'booked')
  and (
    (start_date <= p_end_date and end_date >= p_start_date)
  );

  return v_conflicts = 0;
end;
$$ language plpgsql security definer;

-- Function to automatically create availability entry when booking is confirmed
create or replace function public.create_booking_availability()
returns trigger as $$
begin
  -- Only create availability entry when booking is accepted
  if new.status = 'accepted' and (old.status is null or old.status != 'accepted') then
    insert into public.listing_availability (
      listing_id,
      start_date,
      end_date,
      status,
      booking_id
    ) values (
      new.listing_id,
      new.start_date::date,
      new.end_date::date,
      'booked',
      new.id
    )
    on conflict do nothing;
  end if;

  -- Remove availability entry if booking is cancelled or declined
  if new.status in ('cancelled', 'declined') and old.status = 'accepted' then
    delete from public.listing_availability
    where booking_id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-manage availability when bookings change
create trigger handle_booking_availability
  after insert or update on public.bookings
  for each row
  execute function public.create_booking_availability();

-- Function to get available dates for a listing in a given month
create or replace function public.get_listing_available_dates(
  p_listing_id uuid,
  p_year integer,
  p_month integer
)
returns table (
  date_value date,
  status text
) as $$
begin
  return query
  select
    d::date as date_value,
    coalesce(
      (
        select la.status
        from public.listing_availability la
        where la.listing_id = p_listing_id
        and d::date between la.start_date and la.end_date
        order by
          case la.status
            when 'booked' then 1
            when 'blocked' then 2
            else 3
          end
        limit 1
      ),
      'available'
    ) as status
  from generate_series(
    make_date(p_year, p_month, 1),
    (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date,
    interval '1 day'
  ) d;
end;
$$ language plpgsql security definer;
