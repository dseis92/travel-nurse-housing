-- Create availability_blocks table for granular calendar management
create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- References
  listing_id uuid references public.listings(id) on delete cascade not null,

  -- Date range
  start_date date not null,
  end_date date not null,

  -- Availability status
  status text not null check (status in ('available', 'blocked', 'booked')),

  -- Optional booking reference (when status = 'booked')
  booking_id uuid references public.bookings(id) on delete set null,

  -- Minimum stay for this period (in nights)
  min_stay_nights integer default 1,

  -- Price override for this period (null = use listing's default price)
  price_per_month integer,

  -- Reason for blocking (if status = 'blocked')
  block_reason text check (block_reason in ('maintenance', 'personal_use', 'other', null)),
  notes text,

  -- Recurring pattern (for future enhancement)
  is_recurring boolean default false,
  recurrence_rule text,

  -- Check dates are valid
  constraint valid_date_range check (end_date >= start_date)
);

-- Create indexes for availability queries
create index availability_blocks_listing_id_idx on public.availability_blocks(listing_id);
create index availability_blocks_status_idx on public.availability_blocks(status);
create index availability_blocks_date_range_idx on public.availability_blocks(start_date, end_date);
create index availability_blocks_booking_id_idx on public.availability_blocks(booking_id)
  where booking_id is not null;

-- Enable Row Level Security
alter table public.availability_blocks enable row level security;

-- Policies for availability_blocks

-- Anyone can view available blocks for published listings
create policy "Anyone can view available blocks for published listings"
  on public.availability_blocks
  for select
  using (
    status = 'available'
    and exists (
      select 1 from public.listings
      where id = availability_blocks.listing_id
        and is_published = true
        and is_active = true
    )
  );

-- Hosts can view all blocks for their listings
create policy "Hosts can view blocks for their listings"
  on public.availability_blocks
  for select
  using (
    exists (
      select 1 from public.listings
      where id = availability_blocks.listing_id
        and host_id = auth.uid()
    )
  );

-- Hosts can create blocks for their listings
create policy "Hosts can create blocks for their listings"
  on public.availability_blocks
  for insert
  with check (
    exists (
      select 1 from public.listings
      where id = availability_blocks.listing_id
        and host_id = auth.uid()
    )
  );

-- Hosts can update blocks for their listings
create policy "Hosts can update blocks for their listings"
  on public.availability_blocks
  for update
  using (
    exists (
      select 1 from public.listings
      where id = availability_blocks.listing_id
        and host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings
      where id = availability_blocks.listing_id
        and host_id = auth.uid()
    )
  );

-- Hosts can delete blocks for their listings (only non-booked blocks)
create policy "Hosts can delete blocks for their listings"
  on public.availability_blocks
  for delete
  using (
    status != 'booked'
    and exists (
      select 1 from public.listings
      where id = availability_blocks.listing_id
        and host_id = auth.uid()
    )
  );

-- Trigger to update updated_at
create trigger handle_availability_blocks_updated_at
  before update on public.availability_blocks
  for each row
  execute function public.handle_updated_at();

-- Function to check if dates are available for a listing
create or replace function public.is_date_range_available(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date,
  p_exclude_booking_id uuid default null
)
returns boolean as $$
declare
  v_has_conflict boolean;
begin
  -- Check if there are any booked or blocked periods that overlap
  select exists(
    select 1
    from public.availability_blocks
    where listing_id = p_listing_id
      and status in ('booked', 'blocked')
      and (booking_id != p_exclude_booking_id or booking_id is null or p_exclude_booking_id is null)
      and (
        -- New booking overlaps with existing block
        (p_start_date <= end_date and p_end_date >= start_date)
      )
  ) into v_has_conflict;

  -- Also check accepted bookings (belt and suspenders approach)
  if not v_has_conflict then
    select exists(
      select 1
      from public.bookings
      where listing_id = p_listing_id
        and status = 'accepted'
        and (id != p_exclude_booking_id or p_exclude_booking_id is null)
        and (
          (p_start_date <= end_date and p_end_date >= start_date)
        )
    ) into v_has_conflict;
  end if;

  return not v_has_conflict;
end;
$$ language plpgsql;

-- Function to automatically create availability blocks when booking is accepted
create or replace function public.create_availability_block_for_booking()
returns trigger as $$
begin
  -- Only create block when status changes to accepted
  if new.status = 'accepted' and (old.status is null or old.status != 'accepted') then
    -- Create or update availability block
    insert into public.availability_blocks (
      listing_id,
      start_date,
      end_date,
      status,
      booking_id,
      notes
    )
    values (
      new.listing_id,
      new.start_date,
      new.end_date,
      'booked',
      new.id,
      'Automatically blocked by booking'
    )
    on conflict (listing_id, start_date, end_date)
    do update set
      status = 'booked',
      booking_id = new.id,
      updated_at = now();
  end if;

  -- Remove availability block when booking is cancelled or declined
  if new.status in ('cancelled', 'declined') and old.status = 'accepted' then
    delete from public.availability_blocks
    where booking_id = new.id;
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to sync availability blocks with bookings
create trigger sync_availability_blocks_with_bookings
  after insert or update on public.bookings
  for each row
  execute function public.create_availability_block_for_booking();

-- Function to get available dates for a listing
create or replace function public.get_listing_availability(
  p_listing_id uuid,
  p_start_date date default current_date,
  p_months integer default 12
)
returns table(
  date date,
  status text,
  price_per_month integer,
  min_stay_nights integer,
  booking_id uuid
) as $$
begin
  return query
  with date_series as (
    select generate_series(
      p_start_date,
      p_start_date + (p_months || ' months')::interval,
      '1 day'::interval
    )::date as date
  ),
  listing_info as (
    select price_per_month as default_price
    from public.listings
    where id = p_listing_id
  )
  select
    ds.date,
    coalesce(ab.status, 'available') as status,
    coalesce(ab.price_per_month, li.default_price) as price_per_month,
    coalesce(ab.min_stay_nights, 1) as min_stay_nights,
    ab.booking_id
  from date_series ds
  cross join listing_info li
  left join public.availability_blocks ab on
    ab.listing_id = p_listing_id
    and ds.date >= ab.start_date
    and ds.date <= ab.end_date
  order by ds.date;
end;
$$ language plpgsql;

-- Function to block dates (for host use)
create or replace function public.block_dates(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date,
  p_block_reason text default 'other',
  p_notes text default null
)
returns uuid as $$
declare
  v_block_id uuid;
begin
  -- Check if host owns the listing
  if not exists (
    select 1 from public.listings
    where id = p_listing_id
      and host_id = auth.uid()
  ) then
    raise exception 'Unauthorized: You do not own this listing';
  end if;

  -- Check if dates are not already booked
  if not public.is_date_range_available(p_listing_id, p_start_date, p_end_date) then
    raise exception 'Date range is already booked or blocked';
  end if;

  -- Create the block
  insert into public.availability_blocks (
    listing_id,
    start_date,
    end_date,
    status,
    block_reason,
    notes
  )
  values (
    p_listing_id,
    p_start_date,
    p_end_date,
    'blocked',
    p_block_reason,
    p_notes
  )
  returning id into v_block_id;

  return v_block_id;
end;
$$ language plpgsql security definer;

-- Function to unblock dates
create or replace function public.unblock_dates(
  p_block_id uuid
)
returns void as $$
begin
  -- Check if host owns the listing and block is not for a booking
  if not exists (
    select 1 from public.availability_blocks ab
    join public.listings l on l.id = ab.listing_id
    where ab.id = p_block_id
      and l.host_id = auth.uid()
      and ab.status = 'blocked'
  ) then
    raise exception 'Unauthorized or invalid block';
  end if;

  delete from public.availability_blocks
  where id = p_block_id;
end;
$$ language plpgsql security definer;

-- View for calendar overview
create or replace view public.listing_calendar_overview as
select
  l.id as listing_id,
  l.title as listing_title,
  l.host_id,
  count(ab.id) filter (where ab.status = 'available') as available_blocks,
  count(ab.id) filter (where ab.status = 'booked') as booked_blocks,
  count(ab.id) filter (where ab.status = 'blocked') as blocked_blocks,
  min(ab.start_date) filter (where ab.status = 'available' and ab.start_date >= current_date) as next_available_date,
  max(ab.end_date) filter (where ab.status = 'available') as last_available_date
from public.listings l
left join public.availability_blocks ab on ab.listing_id = l.id
group by l.id, l.title, l.host_id;

-- Grant access to the view
grant select on public.listing_calendar_overview to authenticated;
